import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { firstName, lastName, email, password } = await req.json();

        if (!firstName || !email || !password) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (existing) {
            return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`.trim();

        const [newUser] = await db.insert(users).values({ email, name: fullName, passwordHash }).returning();

        // Initialize default subscription for new user
        await db.insert(subscriptions).values({
            userId: newUser.id,
            plan: "free",
            responsesUsedThisMonth: 0,
            responsesLimit: 10,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: error.message || "Signup failed" }, { status: 500 });
    }
}
