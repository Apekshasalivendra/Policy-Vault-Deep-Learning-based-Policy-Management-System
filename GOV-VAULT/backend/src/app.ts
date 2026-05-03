import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import authRoutes from './routes/auth.routes';
import mockRoutes from './routes/mock.routes';
import familyRoutes from './routes/family.routes';
import adminRoutes from './routes/admin.routes';
import claimRoutes from './routes/claim.routes';
import recommendationRoutes from './routes/recommendation.routes';
import analyticsRoutes from './routes/analytics.routes';
import entitlementRoutes from './routes/entitlement.routes';
import adminEntitlementRoutes from './routes/admin.entitlement.routes';
import familyDocsRoutes from './routes/family-docs.routes';
import path from 'path';
import notificationRoutes from './routes/notification.routes';
import policyRoutes from './routes/policy.routes';

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-user-id', 'x-user-role', 'x-forwarded-for'],
  })
);

app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for development testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/mock', mockRoutes);
app.use('/family', familyRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/analytics', analyticsRoutes);
app.use('/claim', claimRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/entitlements', entitlementRoutes);
app.use('/notifications', notificationRoutes);
app.use('/policies', policyRoutes);
app.use('/api', familyDocsRoutes); // Mount BEFORE adminEntitlementRoutes to avoid global verifyToken interception
app.use(adminEntitlementRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
