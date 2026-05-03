import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'saigowtham05peddinti@gmail.com',
        pass: 'ywyu ugzi qacc wnmq'
    }
});

// In-memory OTP store: { email: { otp: string, expiresAt: number } }
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

export const sendOtpEmail = async (email: string): Promise<void> => {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiration
    otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000
    });

    const mailOptions = {
        from: 'GOV-VAULT <saigowtham05peddinti@gmail.com>',
        to: email,
        subject: 'GOV-VAULT - Verify your email',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to GOV-VAULT</h2>
                <p>Please use the following OTP to verify your email address. This OTP is valid for 10 minutes.</p>
                <h1 style="color: #4F46E5; letter-spacing: 2px;">${otp}</h1>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const verifyOtp = (email: string, otp: string): boolean => {
    const record = otpStore.get(email);
    if (!record) return false;
    
    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return false;
    }
    
    if (record.otp === otp) {
        otpStore.delete(email); // OTP used successfully
        return true;
    }
    
    return false;
};

export const sendMockDocumentRequestEmail = async (email: string, familyId: string): Promise<void> => {
    const uploadLink = `${process.env.FRONTEND_URL || 'https://frontend-six-omega-72.vercel.app'}/upload-documents/${familyId}`;
    
    const mailOptions = {
        from: 'GOV-VAULT Admin <saigowtham05peddinti@gmail.com>',
        to: email,
        subject: 'GOV-VAULT Action Required: Family Document Verification',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">GOV-VAULT</h1>
                    <p style="color: #64748b; margin-top: 5px; font-size: 14px; text-transform: uppercase; font-weight: 600;">Secure Document Portal</p>
                </div>
                
                <div style="background-color: white; padding: 25px; border-radius: 8px; border-top: 4px solid #4f46e5; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Action Required: Document Upload</h2>
                    <p style="color: #334155; line-height: 1.6; font-size: 15px;">
                        Dear Citizen,<br><br>
                        The GOV-VAULT administration requires additional documentation to process and verify your Family ID request. To proceed with the verification, please provide clear, scanned copies of the following documents:
                    </p>
                    
                    <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #1e293b; text-transform: uppercase;">Required Documents:</h3>
                        <ul style="color: #334155; font-size: 14px; line-height: 1.5; padding-left: 20px; margin-bottom: 0;">
                            <li><strong>Aadhaar Cards</strong> for <u>all registered family members</u> (Front & Back).</li>
                            <li><strong>PAN Cards</strong> (if applicable and provided during registration).</li>
                            <li>Ensure all copies are clear, legible, and completely visible without any cut-offs.</li>
                        </ul>
                    </div>

                    <p style="color: #334155; line-height: 1.6; font-size: 15px; text-align: center; margin-top: 30px;">
                        Please click the secure link below to access your personal upload portal:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${uploadLink}" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">Access Secure Upload Portal</a>
                    </div>
                </div>
                
                <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
                    <p style="color: #0f172a; font-size: 13px; font-weight: bold; margin-bottom: 5px;">⚠️ Security & Privacy Notice</p>
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 0;">
                        This is a uniquely generated, secure link meant only for you. <strong>Do not share this link or forward this email to anyone.</strong> GOV-VAULT administrators will <em>never</em> ask for your account password, OTPs, or financial details over email. If you did not initiate this request, please contact support immediately.
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendPolicyDocumentRequestEmail = async (email: string, claimId: string, policyName: string): Promise<void> => {
    const uploadLink = `${process.env.FRONTEND_URL || 'https://frontend-six-omega-72.vercel.app'}/upload-documents/claim-${claimId}`;

    const mailOptions = {
        from: 'GOV-VAULT Admin <saigowtham05peddinti@gmail.com>',
        to: email,
        subject: 'GOV-VAULT Action Required: Policy Claim Document Verification',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">GOV-VAULT</h1>
                    <p style="color: #64748b; margin-top: 5px; font-size: 14px; text-transform: uppercase; font-weight: 600;">Policy Claims Portal</p>
                </div>

                <div style="background-color: white; padding: 25px; border-radius: 8px; border-top: 4px solid #7c3aed; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Action Required: Policy Claim Documents</h2>
                    <p style="color: #334155; line-height: 1.6; font-size: 15px;">
                        Dear Citizen,<br><br>
                        The GOV-VAULT administration requires additional documentation to process your policy claim for <strong>${policyName}</strong>. Please upload the following:
                    </p>

                    <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #1e293b; text-transform: uppercase;">Required Documents:</h3>
                        <ul style="color: #334155; font-size: 14px; line-height: 1.5; padding-left: 20px; margin-bottom: 0;">
                            <li><strong>Death Certificate</strong> of the policy holder (if claiming as nominee)</li>
                            <li><strong>Valid ID proof</strong> of the claimant (Aadhaar / PAN)</li>
                            <li><strong>Original Policy Document</strong> or policy number proof</li>
                            <li>Bank account details (cancelled cheque or passbook copy)</li>
                        </ul>
                    </div>

                    <p style="color: #334155; line-height: 1.6; font-size: 15px; text-align: center; margin-top: 30px;">
                        Click the secure link below to upload your documents:
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${uploadLink}" style="display: inline-block; padding: 14px 28px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);">Upload Policy Documents</a>
                    </div>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
                    <p style="color: #0f172a; font-size: 13px; font-weight: bold; margin-bottom: 5px;">⚠️ Security & Privacy Notice</p>
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 0;">
                        This is a uniquely generated, secure link meant only for you. <strong>Do not share this link.</strong> Documents are stored temporarily and deleted immediately after admin review (approve or reject).
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
