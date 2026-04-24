const testClaims = async () => {
    try {
        console.log("--- 1. Testing POST /claims/start (Legal Heir Scenario) ---");
        const startRes = await fetch('http://localhost:4000/claims/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: "deceased-member",
                policyId: "8cb16791-a4f3-47bb-9846-808787a55380",
                claimantName: "Sunita Sharma"
            })
        });
        const startData = await startRes.json();
        console.log("Start Claim Response:", startData);
        if (!startData.claimId) throw new Error("Failed to start claim");

        const claimId = startData.claimId;

        console.log("\n--- 2. Testing POST /claims/upload-document ---");
        const docRes = await fetch('http://localhost:4000/claims/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                claimId,
                documentType: "DEATH_CERTIFICATE",
                filePath: "/mock/path/death_cert.pdf"
            })
        });
        const docData = await docRes.json();
        console.log("Upload Doc Response:", docData);

        console.log("\n--- 3. Testing POST /claims/pre-verify ---");
        const verifyRes = await fetch('http://localhost:4000/claims/pre-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimId })
        });
        const verifyData = await verifyRes.json();
        console.log("Pre-Verify Response:", verifyData);

        console.log("\n--- 4. Testing POST /claims/submit ---");
        const submitRes = await fetch('http://localhost:4000/claims/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claimId })
        });
        const submitData = await submitRes.json();
        console.log("Submit Response:", submitData);

        console.log("\n--- 5. Testing GET /claims/timeline/:claimId ---");
        const timelineRes = await fetch(`http://localhost:4000/claims/timeline/${claimId}`);
        const timelineData = await timelineRes.json();
        console.log("Timeline Data:", JSON.stringify(timelineData, null, 2));

    } catch (err) {
        console.error("Test failed:", err);
    }
};

testClaims();
