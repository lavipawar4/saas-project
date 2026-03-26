import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendOtpEmail(to: string, otp: string) {
    await transporter.sendMail({
        from: `"ReviewAI" <${process.env.SMTP_USER}>`,
        to,
        subject: "Your ReviewAI login code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0f1e; color: #ffffff; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 28px;">
                    <h1 style="font-size: 24px; margin: 0; color: #818cf8;">ReviewAI</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">AI-powered Google Review Management</p>
                </div>
                <h2 style="text-align: center; font-size: 20px; margin: 0 0 8px 0;">Your Login Code</h2>
                <p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 0 0 28px 0;">
                    Enter this 4-digit code to sign in. It expires in <strong style="color: #f59e0b;">5 minutes</strong>.
                </p>
                <div style="background: #1e293b; border: 2px solid #6366f1; border-radius: 16px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #818cf8; margin-left: 12px;">${otp}</span>
                </div>
                <p style="text-align: center; color: #475569; font-size: 13px; margin: 0;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        `,
    });
}
