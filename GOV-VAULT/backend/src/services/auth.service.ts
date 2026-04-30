import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { JwtPayload } from '../types';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

// ── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (
    email: string,
    password: string,
    role: Role = Role.USER
) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword, role },
        select: { id: true, email: true, role: true, createdAt: true },
    });

    await prisma.auditLog.create({
        data: { userId: user.id, action: 'USER_REGISTERED' },
    });

    return user;
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    await prisma.auditLog.create({
        data: { userId: user.id, action: 'USER_LOGIN' },
    });

    return {
        token,
        user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    };
};

// ── Get Me ────────────────────────────────────────────────────────────────────
export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

// ── Get By Email ──────────────────────────────────────────────────────────────
export const getUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, createdAt: true },
    });
};
