import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Handle Policy Claim Uploads
        if (id.startsWith('claim-')) {
            const claimId = id.replace('claim-', '');
            const claim = await prisma.claim.findUnique({ where: { id: claimId } });
            
            if (!claim) {
                res.status(404).json({ error: 'Claim not found.' });
                return;
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                res.status(400).json({ error: 'No files uploaded.' });
                return;
            }

            // Move files to claim-specific directory for ephemeral storage
            const claimDir = path.join(uploadDir, `claim-${claimId}`);
            if (!fs.existsSync(claimDir)) fs.mkdirSync(claimDir, { recursive: true });

            const savedDocs = [];
            for (const file of files) {
                const newPath = path.join(claimDir, file.filename);
                fs.renameSync(file.path, newPath);
                savedDocs.push({ fileName: file.originalname, filePath: `/uploads/claim-${claimId}/${file.filename}` });
            }

            res.status(200).json({ message: 'Documents uploaded successfully.', documents: savedDocs });
            return;
        }

        // Handle Family Uploads
        const family = await prisma.family.findUnique({ where: { id } });
        if (!family) {
            res.status(404).json({ error: 'Family not found.' });
            return;
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded.' });
            return;
        }

        const savedDocs = [];
        for (const file of files) {
            const fileName = file.filename;
            const filePath = `/uploads/${fileName}`;

            const doc = await prisma.familyDocument.create({
                data: { familyId: id, fileName: file.originalname, filePath }
            });
            savedDocs.push(doc);
        }

        res.status(200).json({ message: 'Documents uploaded successfully.', documents: savedDocs });
    } catch (error: any) {
        console.error('[family-docs.controller] uploadDocuments error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Handle Policy Claim Documents (ephemeral storage)
        if (id.startsWith('claim-')) {
            const claimId = id.replace('claim-', '');
            const claimDir = path.join(uploadDir, `claim-${claimId}`);
            
            if (!fs.existsSync(claimDir)) {
                res.status(200).json({ documents: [] });
                return;
            }

            const files = fs.readdirSync(claimDir);
            const documents = files.map(file => ({
                id: file,
                familyId: id,
                fileName: file,
                filePath: `/uploads/claim-${claimId}/${file}`,
                uploadedAt: fs.statSync(path.join(claimDir, file)).mtime
            }));

            res.status(200).json({ documents });
            return;
        }

        // Handle Family Documents (database storage)
        const documents = await prisma.familyDocument.findMany({
            where: { familyId: id },
            orderBy: { uploadedAt: 'desc' }
        });

        res.status(200).json({ documents });
    } catch (error: any) {
        console.error('[family-docs.controller] getDocuments error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
