import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as familyDocsController from '../controllers/family-docs.controller';
import { verifyToken, allowAdmin } from '../middleware/auth.middleware';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Accept images and pdfs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

// Routes
// Note: We'll allow public uploads for now because the user clicks the link from an email 
// without needing to log in, but fetching is restricted to Admins.
router.post('/families/:id/documents', upload.array('files', 10), familyDocsController.uploadDocuments);
router.get('/families/:id/documents', verifyToken, allowAdmin, familyDocsController.getDocuments);

export default router;
