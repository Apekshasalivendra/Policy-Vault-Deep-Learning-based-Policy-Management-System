import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkHealth = async (req: Request, res: Response): Promise<void> => {
    try {
        // Optional: verify DB connection works
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok" });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({ status: "error", message: "Database connection failed" });
    }
};
