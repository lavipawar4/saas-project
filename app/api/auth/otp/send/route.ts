import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { otpTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendOtpEmail } from "@/lib/mailer";

function generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete old OTPs for this email
        await db.delete(otpTokens).where(eq(otpTokens.email, email));

        // Save new OTP in DB
        await db.insert(otpTokens).values({ email, otp, expiresAt });

        // Send via SMTP
        await sendOtpEmail(email, otp);

        console.log(`\n🔐 OTP for ${email}: ${otp} (5 min)\n`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("OTP send error:", error.message);
        return NextResponse.json({ error: "Failed to send OTP. Check SMTP config." }, { status: 500 });
    }
}
