import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { otpTokens, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();
        if (!email || !otp) return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });

        const now = new Date();

        // Find valid OTP
        const record = await db.query.otpTokens.findFirst({
            where: (t, { and, eq, gt }) => and(
                eq(t.email, email),
                eq(t.otp, otp),
                eq(t.used, false),
                gt(t.expiresAt, now)
            )
        });

        if (!record) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
        }

        // Mark OTP as used
        await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, record.id));

        // Get or create user
        let user = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (!user) {
            const [newUser] = await db.insert(users).values({ email, name: email.split("@")[0] }).returning();
            user = newUser;
        }

        return NextResponse.json({ success: true, userId: user.id, email: user.email });
    } catch (error: any) {
        console.error("OTP verify error:", error);
        return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
    }
}
