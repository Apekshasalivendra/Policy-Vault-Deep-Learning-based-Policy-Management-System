const axios = require('axios');
const { execSync } = require('child_process');

async function testAudit() {
    console.log("== Starting Audit Forensic Verification ==");
    try {
        // 1. Get User JWT (register first if needed)
        try {
            await axios.post('http://localhost:3000/auth/register', { email: 'user35@govvault.in', password: 'User@123', role: 'USER' });
        } catch (e) {
            // ignore if exists
        }
        const userLogin = await axios.post('http://localhost:3000/auth/login', {
            email: 'user35@govvault.in',
            password: 'User@123'
        });
        const userToken = userLogin.data.token;
        const userPayload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
        const userId = userPayload.userId;
        console.log("--> User Token Grabbed:", userToken.substring(0, 15) + "...");

        // 1.5 Get Admin JWT
        try {
            await axios.post('http://localhost:3000/auth/register', { email: 'admin35@govvault.in', password: 'Admin@123', role: 'ADMIN' });
        } catch (e) {
            // ignore
        }

        console.log("--> Elevating admin via SQL...");
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvault_backend -c "UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin35@govvault.in';"`);

        const adminLogin = await axios.post('http://localhost:3000/auth/login', {
            email: 'admin35@govvault.in',
            password: 'Admin@123'
        });
        const adminToken = adminLogin.data.token;
        console.log("--> Admin Token Grabbed:", adminToken.substring(0, 15) + "...");

        // 3. Inject Family & Member targeting UserID via SQL natively
        console.log("--> Seeding native raw DB instances...");
        const familyId = require('crypto').randomUUID();
        const memberId = require('crypto').randomUUID();
        const claimId = require('crypto').randomUUID();
        const tempFamilyId = "TMP-" + Math.floor(Math.random() * 1000000);

        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvault_backend -c "INSERT INTO public.\\\"families\\\" (id, \\\"temporaryFamilyId\\\", status, \\\"createdById\\\", \\\"createdAt\\\") VALUES ('${familyId}', '${tempFamilyId}', 'APPROVED', '${userId}', NOW());"`);
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvault_backend -c "INSERT INTO public.\\\"family_members\\\" (id, \\\"familyId\\\", name, phone, \\\"aadhaarEncrypted\\\", \\\"aadhaarHash\\\", \\\"incomeRange\\\", occupation, age, \\\"isAadhaarVerified\\\", \\\"isPanVerified\\\", \\\"panEncrypted\\\", \\\"panHash\\\", \\\"createdAt\\\") VALUES ('${memberId}', '${familyId}', 'Test User', '9999999999', 'enc', 'hash-${tempFamilyId}', 'BPL', 'Farmer', 40, true, false, 'encpan', 'hashpan', NOW());"`);

        // 4. Elevate the mock states in DB manually to bypass the entitlement Document upload logic which requires actual files
        console.log("--> Elevating Claim directly to SUBMITTED status using shell injection...");
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvaultdb -c "INSERT INTO entitlement.\\\"PolicyRegistry\\\" (id, \\\"memberId\\\", \\\"policyType\\\", \\\"issuingAuthority\\\", status, \\\"createdAt\\\") VALUES ('scheme-1', '${memberId}', 'INSURANCE', 'MOCK AUTH', 'ACTIVE', NOW()) ON CONFLICT (id) DO NOTHING;"`);
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvault_backend -c "INSERT INTO public.\\\"claims\\\" (id, \\\"familyId\\\", \\\"memberId\\\", \\\"schemeId\\\", status, source, \\\"createdAt\\\") VALUES ('${claimId}', '${familyId}', '${memberId}', 'scheme-1', 'SUBMITTED', 'MANUAL', NOW());"`);
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvaultdb -c "INSERT INTO entitlement.\\\"StructuredClaim\\\" (id, \\\"memberId\\\", \\\"policyId\\\", \\\"claimantName\\\", \\\"claimType\\\", status, \\\"createdAt\\\", \\\"updatedAt\\\") VALUES ('${claimId}', '${memberId}', 'scheme-1', 'Test Member', 'NOMINEE', 'SUBMITTED', NOW(), NOW());"`);
        execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvaultdb -c "INSERT INTO entitlement.\\\"ClaimTimeline\\\" (id, \\\"claimId\\\", status, sequence, note, \\\"createdAt\\\") VALUES ('timeline-${Math.floor(Math.random() * 10000)}', '${claimId}', 'SUBMITTED', 1, 'Injected', NOW());"`);

        // 6. Admin State Transition to UNDER_ADMIN_REVIEW
        console.log(`--> Testing Admin Transition on Claim: ${claimId}`);
        const review = await axios.post(`http://localhost:3000/admin/entitlements/claims/${claimId}/review`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log(`--> Transition Success! Status: ${review.data.status}`);

        // 7. Validate Forensics via SQL explicitly
        console.log(`\n== Fetching Backend DB Notifications & Audit Trails ==`);
        const forensicCheck = execSync(`docker exec -i govvault_postgres psql -U govvault_user -d govvaultdb -c "SELECT action, \\\"previousStatus\\\", \\\"newStatus\\\", \\\"performedByRole\\\" FROM entitlement.\\\"ClaimEventLog\\\" WHERE \\\"claimId\\\" = '${claimId}';"`);
        console.log(forensicCheck.toString());

        console.log("== Verification Complete! ==");
    } catch (e) {
        if (e.response) {
            console.error("API ERROR:", e.response.status, e.response.data);
        } else {
            console.error("SYS ERROR:", e.message);
        }
    }
}

testAudit();
