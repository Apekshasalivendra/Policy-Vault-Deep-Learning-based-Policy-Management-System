# GOV-VAULT: Parivar Netra 🏛️

### Unified Deep Learning-Based Family ID & Policy Management System

**GOV-VAULT** is a production-grade e-governance ecosystem designed to solve the "Policy Awareness Gap." By combining a unified Family ID system (Parivar Netra) with Retrieval-Augmented Generation (RAG) AI, the platform ensures that no citizen is left behind from their entitled government benefits and insurance policies.

---

## 🚀 The Complete Project Workflow

This section documents the end-to-end lifecycle of the GOV-VAULT platform across all 17 core functional stages.

### Phase 1: Discovery & Citizen Onboarding

#### 1. Public Landing Page
The portal provides a clean, accessible entry point for citizens to understand the "Unified Family Vault" concept.
![1. Landing Page](docs/images/1_landing_page.png)

#### 2. Secure Login
Existing users and administrators access their accounts via a JWT-protected login gateway.
![2. Login Page](docs/images/2_login_page.png)

#### 3. Citizen Registration
New users register by providing basic credentials, initiating the creation of their family's digital infrastructure.
![3. Register Page](docs/images/3_register_page.png)

---

### Phase 2: Family Setup & Initial Application

#### 4. User Onboarding Dashboard
The initial view for a new user, guiding them to begin their family registration process.
![4. Dashboard Page](docs/images/4_dashboard_page.png)

#### 5. Family Detail Submission
Users add family members, including sensitive demographic data like income, occupation, and caste, which are encrypted using AES-256 before storage.
![5. Apply Page](docs/images/5_apply_page.png)

#### 6. Temporary ID Generation
Upon submission, the system generates a unique **Temporary Family ID**. The status is set to `PENDING` until a government official verifies the data.
![6. Temporary Family ID](docs/images/6_temporary_family_id.png)

---

### Phase 3: Administrative Governance & KYC

#### 7. Admin Control Panel
Government administrators oversee the entire state's registration metrics and pending verification queues.
![7. Admin Dashboard](docs/images/7_admin_dashboard.png)

#### 8. Family Verification Queue
Admins review family structures and demographic metadata to ensure compliance with government records.
![8. Admin Side Family Approval](docs/images/8_adminside_family_approval.jpeg)

#### 9. Automated Document Requests
If digital records are insufficient, the admin triggers a **Document Request**. An automated email is dispatched to the citizen with a secure upload link.
![9. Mail Sent to User](docs/images/9_mail_sent_to_user.jpeg)

#### 10. Ephemeral Document Review
Citizens upload proofs (Aadhaar/Income certificates), which appear instantly in the Admin portal. These files are deleted after verification to ensure privacy.
![10. User Uploads Documents](docs/images/10_user_uploads_documents.jpeg)

---

### Phase 4: Verified Access & AI Recommendations

#### 11. Final Verified Dashboard
Once approved, the user's dashboard is fully unlocked, showing their verified family ID and active status.
![11. Final User Dashboard](docs/images/11_final_user_dashboard.png)

#### 12. AI Scheme Saathi (RAG Engine)
Using a Pinecone vector database and Groq (Llama-3), the system recommends specific welfare schemes tailored to the family's exact profile.
![12. AI Schemes](docs/images/12_ai_schemes.png)

#### 13. Integrated Policy View
The "Vault" aggregates all insurance policies (LIC, etc.) linked to family members, providing a single source of truth for household coverage.
![13. Policy Dashboard](docs/images/13_policy_dashboard.png)

---

### Phase 5: Policy Lifecycle & Automated Claims

#### 14. Life Status Monitoring
The system integrates with death registries. In the event of a tragedy, the status of a family member is updated to initiate automated benefit transfers.
![14. Alive or Deceased](docs/images/14_alive_or_deceased.png)

#### 15. User-Side Claim Tracking
Nominees can track the progress of their insurance claims directly from their dashboard without visiting a physical office.
![15. User Side Claims Details](docs/images/15_userside_Claims_details.png)

#### 16. Administrative Claim Approval
Admins verify death reports and policy trigger conditions before releasing funds to the family's registered bank account.
![16. Admin Side Policy Approval](docs/images/16_adminside_policyapproval.png)

---

### Phase 6: Specialized Social Welfare

#### 17. Orphan Child Trust Fund
A specialized module for children who have lost both parents. It supports walk-in biometric registration and automated creation of trust funds from parent policies to pay for school fees.
![17. Admin Side Orphan](docs/images/17_adminside_orphan.png)

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL 16.
- **AI/ML**: FastAPI, Python, Pinecone (Vector DB), LangChain, Groq (Llama-3).
- **Security**: AES-256 Encryption, SHA-256 Hashing, JWT Authentication.
- **DevOps**: Docker, Docker Compose.

---

## 🚀 Installation & Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Gowtham0507/Policy-Vault-Deep-Learning-based-Policy-Management-System.git
   cd Policy-Vault-Deep-Learning-based-Policy-Management-System
   ```
2. **Environment**: Configure `.env` with your `JWT_SECRET` and `GROQ_API_KEY`.
3. **Launch**:
   ```bash
   docker compose up --build -d
   ```
4. **Initialize DB**:
   ```bash
   docker exec govvault_backend npx prisma migrate deploy
   docker exec govvault_backend npm run seed
   ```

---

Developed with ❤️ for Digital Governance by **Gowtham**.
