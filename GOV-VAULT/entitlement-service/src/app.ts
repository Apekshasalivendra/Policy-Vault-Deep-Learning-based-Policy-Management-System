import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import healthRoutes from './routes/health.routes';

const app: Express = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());

import policyRoutes from './routes/policy.routes';
import claimRoutes from './routes/claim.routes';
import adminRoutes from './routes/admin.routes';
import memberRoutes from './routes/member.routes';

// Routes
app.use('/uploads', express.static('uploads'));
app.use('/health', healthRoutes);
app.use('/policies', policyRoutes);
app.use('/claims', claimRoutes);
app.use('/admin', adminRoutes);
app.use('/members', memberRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Entitlement-Service] Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
