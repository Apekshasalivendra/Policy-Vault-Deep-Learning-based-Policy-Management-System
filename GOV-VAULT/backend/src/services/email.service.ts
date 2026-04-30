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
        subject: 'GOV-VAULT - Document Upload Required',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Action Required: Upload Aadhaar Documents</h2>
                <p>The GOV-VAULT administration requires scanned copies of Aadhaar cards for all members of your family to process your Family ID request.</p>
                <p>Please click the button below to securely upload your documents:</p>
                <a href="${uploadLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">Upload Documents</a>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
