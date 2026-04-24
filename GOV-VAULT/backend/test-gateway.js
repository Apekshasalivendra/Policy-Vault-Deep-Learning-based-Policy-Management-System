import fs from 'fs';
import { execSync } from 'child_process';

const testGateway = async () => {
    try {
        console.log("--- 0. Wiping Database Records ---");
        execSync('npx ts-node clean.ts', { stdio: 'inherit', cwd: 'D:\\capstone\\GOV-VAULT\\backend' });
        execSync('set DATABASE_URL=postgresql://govvault_user:govvault_pass@localhost:5432/govvaultdb?schema=public && npx ts-node clean.ts', { stdio: 'inherit', cwd: 'D:\\capstone\\GOV-VAULT\\entitlement-service' });

        console.log("--- 1. Logging in to get Token ---");
        const loginRes = await fetch('http://localhost:3003/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'aarav.sharma@govvault.in', password: 'User@1234' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error("Login failed");
        console.log("Token obtained.");

        console.log("\n--- 2. Testing GET /entitlements/policies/:memberId ---");
        const policyRes = await fetch('http://localhost:3003/entitlements/policies/test-gateway-member', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const policyData = await policyRes.json();
        console.log("Policies:", JSON.stringify(policyData, null, 2));

        const policyId = policyData.policies[policyData.policies.length - 1].policyId;
        if (!policyId) throw new Error("No claimable policies found to test with");

        console.log("\n--- 3. Testing POST /entitlements/claims/start ---");
        const startRes = await fetch('http://localhost:3003/entitlements/claims/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                memberId: "test-gateway-member",
                policyId: policyId,
                claimantName: "Sunita Sharma"
            })
        });

        let startData;
        try {
            startData = await startRes.json();
        } catch (e) {
            console.error("Text response instead of JSON:", await startRes.text());
            throw e;
        }
        console.log("Start Claim Response:", startData);
        if (!startData.claimId) throw new Error("Failed to start claim");

        const claimId = startData.claimId;

        console.log("\n--- 4. Testing POST /entitlements/claims/upload-document (Multipart ArrayBuffer) ---");
        // Create Mock multipart FormData via browser-like api
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="claimId"\r\n\r\n`;
        body += `${claimId}\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="documentType"\r\n\r\n`;
        body += `DEATH_CERTIFICATE\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n`;
        body += `Content-Type: application/pdf\r\n\r\n`;
        body += `FakePDFContent123\r\n`;
        body += `--${boundary}--\r\n`;

        const docRes = await fetch('http://localhost:3003/entitlements/claims/upload-document', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });
        const docData = await docRes.json();
        console.log("Upload Doc Response:", docData);

        console.log("\n--- 5. Testing POST /entitlements/claims/pre-verify ---");
        const verifyRes = await fetch('http://localhost:3003/entitlements/claims/pre-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ claimId })
        });
        const verifyData = await verifyRes.json();
        console.log("Pre-Verify Response:", verifyData);

        console.log("\n--- 6. Testing GET /entitlements/claims/timeline/:claimId ---");
        const timelineRes = await fetch(`http://localhost:3003/entitlements/claims/timeline/${claimId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const timelineData = await timelineRes.json();
        console.log("Timeline Data:", JSON.stringify(timelineData, null, 2));

    } catch (err) {
        console.error("Test failed:", err);
    }
};

testGateway();
