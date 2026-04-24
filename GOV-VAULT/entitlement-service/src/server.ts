import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`[Entitlement-Service] Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception thrown", err);
    process.exit(1);
});
