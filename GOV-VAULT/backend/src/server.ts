import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
    console.log(`[GOV-VAULT] Server running on http://localhost:${PORT}`);
});

server.setTimeout(10000);

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception thrown", err);
    process.exit(1);
});
