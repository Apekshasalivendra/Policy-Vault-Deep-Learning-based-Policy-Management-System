# GOV-VAULT Backend

Production-grade REST API for GOV-VAULT — Phase 2.

Built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## Project Structure

```
GOV-VAULT/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # User, AuditLog, Family, FamilyMember, Claim
│   │   └── seed.ts           # Mock data seed script
│   ├── src/
│   │   ├── controllers/      # auth, mock, family, admin
│   │   ├── middleware/       # JWT auth & role guards
│   │   ├── routes/           # auth, mock, family, admin routes
│   │   ├── services/         # auth, mock, family, admin business logic
│   │   ├── utils/            # encryption (AES-256), hash (SHA-256), otpStore
│   │   ├── types/            # Shared TypeScript types
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # HTTP server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── GOV-VAULT.postman_collection.json  ← Import into Postman to test
├── .env.example
└── README.md
```

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

```bash
# From the GOV-VAULT root directory
copy .env.example backend\.env
```

Open `backend/.env` and fill in:

```env
DATABASE_URL="postgresql://your_user:your_pass@localhost:5432/govvaultdb"
JWT_SECRET="your-super-secret-key-min-32-chars"
# Generate encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="<64-hex-chars>"
```

### 3. Start PostgreSQL

You can use Docker just for the database:

```bash
docker compose up postgres -d
```

Or use any local PostgreSQL installation configured to match your `DATABASE_URL`.

### 4. Run Prisma Migrations

```bash
cd backend
npm run prisma:migrate
```

### 5. Seed the Database

```bash
npm run seed
```

This creates:

| Email | Password | Role |
|---|---|---|
| admin@govvault.in | Admin@123 | ADMIN |
| aarav.sharma@govvault.in | User@1234 | USER |
| priya.nair@govvault.in | User@1234 | USER |
| rohit.verma@govvault.in | User@1234 | USER |

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## API Reference

### Health Check

```
GET /health
```

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login, returns JWT |
| GET | `/auth/me` | Bearer JWT | Returns current user profile |

#### Register

```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "Secret@123"
}
```

#### Login

```json
POST /auth/login
{
  "email": "admin@govvault.in",
  "password": "Admin@123"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "email": "admin@govvault.in",
    "role": "ADMIN",
    "createdAt": "..."
  }
}
```

#### Me (Protected)

```
GET /auth/me
Authorization: Bearer <jwt>
```

---

## Phase 2 API Reference

### Mock Government Verification

> Run in order: verify → confirm (get token) → use token in /family/create

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/mock/verify-aadhaar` | None | Initiate Aadhaar OTP (OTP returned in response for dev) |
| POST | `/mock/confirm-aadhaar` | None | Confirm OTP → returns `verificationToken` (JWT, 10 min) |
| POST | `/mock/verify-pan` | None | Validate PAN format |

```json
POST /mock/verify-aadhaar
{ "aadhaar": "123412341234" }
// Response: { "otp": "483921" }

POST /mock/confirm-aadhaar
{ "aadhaar": "123412341234", "otp": "483921" }
// Response: { "verificationToken": "<jwt-valid-10min>" }

POST /mock/verify-pan
{ "pan": "ABCDE1234F" }
// Response: { "verified": true }
```

### Family Registration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/family/create` | Bearer USER JWT | Register a new family (max 8 members) |
| GET | `/family/:id` | Bearer USER JWT | Get family details |

```json
POST /family/create
Authorization: Bearer <userJwt>
{
  "aadhaarVerificationToken": "<token from /mock/confirm-aadhaar>",
  "members": [
    {
      "name": "Aarav Sharma",
      "phone": "9876543210",
      "aadhaar": "123412341234",
      "pan": "ABCDE1234F",
      "incomeRange": "0-2.5L",
      "occupation": "Farmer",
      "age": 35
    }
  ]
}
// Response: { temporaryFamilyId: "xxxxxxxxxxxx", status: "PENDING" }
```

**Fraud protection:**
- `409` — Aadhaar/PAN already in another family
- `400` — Duplicate Aadhaar/PAN within same request
- `429` — More than 3 families registered by same user in 24h

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/families/pending` | Bearer ADMIN JWT | List PENDING families |
| GET | `/admin/families?status=APPROVED` | Bearer ADMIN JWT | List all families (filterable) |
| POST | `/admin/family/:id/approve` | Bearer ADMIN JWT | Approve a family |
| POST | `/admin/family/:id/reject` | Bearer ADMIN JWT | Reject a family |

---

## Docker (Full Stack)

### 1. Configure environment

```bash
copy .env.example .env
```

Edit `.env` at the project root and set `JWT_SECRET`.

### 2. Build and start all services

```bash
docker compose up --build -d
```

This starts:
- `govvault_postgres` — PostgreSQL 16 on port `5432`
- `govvault_backend` — Express API on port `3000`

### 3. Run migrations inside the container

```bash
docker exec govvault_backend npx prisma migrate deploy
```

### 4. Run seed inside the container

```bash
docker exec govvault_backend node -e "require('child_process').execSync('node dist/server.js', {stdio:'inherit'})"
```

Or from host:

```bash
cd backend
DATABASE_URL="postgresql://govvault_user:govvault_pass@localhost:5432/govvaultdb" npm run seed
```

### 5. Tear down

```bash
docker compose down -v
```

---

## Security Features

| Feature | Detail |
|---------|--------|
| Password hashing | bcrypt, 12 salt rounds |
| JWT auth | HS256, configurable expiry |
| Aadhaar verification | Signed 10-min verification JWT (stateless, tamper-proof) |
| AES-256-CBC encryption | Aadhaar + PAN encrypted before storage, random IV per record |
| SHA-256 hashing | `aadhaarHash` / `panHash` for deterministic duplicate detection |
| Fraud detection | Cross-family (hash lookup) + intra-family + per-user rate limit |
| Role-based access | `USER` / `ADMIN` middleware guards |
| Rate limiting | 100 req / 15 min (global) + 3 families / 24h (per user) |
| HTTP headers | helmet (CSP, HSTS, etc.) |
| CORS | Configurable allowed origins |
| Request logging | morgan combined format |

---

## Available Scripts

```bash
npm run dev              # Start dev server with ts-node
npm run build            # Compile TypeScript → dist/
npm run start            # Run compiled production build
npm run prisma:migrate   # Create & apply a new migration (dev)
npm run prisma:migrate:prod  # Apply migrations (production)
npm run seed             # Seed the database
npm run prisma:generate  # Regenerate Prisma client
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for JWT signing (also signs verification tokens) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiry |
| `ENCRYPTION_KEY` | **Yes** | — | 64-hex-char AES-256 key (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins |

---

> Phase 2 complete. Scheme Saathi integration and frontend planned for future phases.
