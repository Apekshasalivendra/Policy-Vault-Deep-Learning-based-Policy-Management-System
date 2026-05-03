import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility to generate mock Aadhaar
const generateMockAadhaar = () => {
    let aadhaar = '';
    for (let i = 0; i < 12; i++) {
        aadhaar += Math.floor(Math.random() * 10).toString();
    }
    return aadhaar;
};

// 1. Register a new orphan child
export const registerOrphan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, fatherName, motherName, guardianName, currentAddress } = req.body;

        if (!name || !fatherName || !motherName || !currentAddress) {
            res.status(400).json({ error: 'Name, Father Name, Mother Name, and Address are required.' });
            return;
        }

        const tempId = `TEMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const aadhaarNumber = generateMockAadhaar();

        const orphan = await prisma.orphan.create({
            data: {
                tempId,
                name,
                fatherName,
                motherName,
                guardianName,
                currentAddress,
                aadhaarNumber,
                biometricsTaken: true, // Mocked as true during registration
                policeVerification: 'PENDING',
            }
        });

        res.status(201).json({ message: 'Orphan registered successfully', orphan });
    } catch (error: any) {
        console.error('[orphan.controller] registerOrphan error:', error);
        res.status(500).json({ error: 'Failed to register orphan' });
    }
};

// 2. Get all orphans (for admin view)
export const getOrphans = async (req: Request, res: Response): Promise<void> => {
    try {
        const orphans = await prisma.orphan.findMany({
            include: {
                trustFund: {
                    include: {
                        transactions: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ orphans });
    } catch (error: any) {
        console.error('[orphan.controller] getOrphans error:', error);
        res.status(500).json({ error: 'Failed to fetch orphans' });
    }
};

// 3. Verify police report and generate Trust Fund
export const verifyOrphan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'VERIFIED' or 'REJECTED'

        if (status !== 'VERIFIED' && status !== 'REJECTED') {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const orphan = await prisma.orphan.findUnique({ where: { id } });
        if (!orphan) {
            res.status(404).json({ error: 'Orphan not found' });
            return;
        }

        if (status === 'REJECTED') {
            const updated = await prisma.orphan.update({
                where: { id },
                data: { policeVerification: 'REJECTED' }
            });
            res.status(200).json({ message: 'Verification rejected', orphan: updated });
            return;
        }

        // Handle VERIFIED
        const permanentId = `CHILD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        // Random policy amount between 2L and 10L
        const amount = Math.floor(Math.random() * 800000) + 200000;

        const updated = await prisma.$transaction(async (tx) => {
            const child = await tx.orphan.update({
                where: { id },
                data: {
                    policeVerification: 'VERIFIED',
                    permanentId
                }
            });

            await tx.trustFund.create({
                data: {
                    orphanId: id,
                    totalAmount: amount,
                    balance: amount
                }
            });

            return child;
        });

        res.status(200).json({ message: 'Child verified and Trust Fund created', orphan: updated });
    } catch (error: any) {
        console.error('[orphan.controller] verifyOrphan error:', error);
        res.status(500).json({ error: 'Failed to verify orphan' });
    }
};

// 4. Deduct fund for a specific purpose (e.g., School Fee)
export const deductFund = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // orphan ID
        const { amount, purpose, toWhom, proofDocUrl } = req.body;

        if (!amount || amount <= 0 || !purpose || !toWhom) {
            res.status(400).json({ error: 'Amount, purpose, and toWhom are required.' });
            return;
        }

        const orphan = await prisma.orphan.findUnique({
            where: { id },
            include: { trustFund: true }
        });

        if (!orphan || !orphan.trustFund) {
            res.status(404).json({ error: 'Trust Fund not found for this child.' });
            return;
        }

        if (orphan.trustFund.balance < amount) {
            res.status(400).json({ error: 'Insufficient funds in the trust account.' });
            return;
        }

        const transaction = await prisma.$transaction(async (tx) => {
            // Update balance
            const updatedFund = await tx.trustFund.update({
                where: { id: orphan.trustFund!.id },
                data: { balance: orphan.trustFund!.balance - amount }
            });

            // Create transaction record
            const txn = await tx.fundTransaction.create({
                data: {
                    fundId: updatedFund.id,
                    amount,
                    purpose,
                    toWhom,
                    proofDocUrl
                }
            });

            return txn;
        });

        res.status(200).json({ message: 'Fund deducted successfully', transaction });
    } catch (error: any) {
        console.error('[orphan.controller] deductFund error:', error);
        res.status(500).json({ error: 'Failed to deduct from trust fund' });
    }
};
