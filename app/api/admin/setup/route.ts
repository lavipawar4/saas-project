import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const adminEmail = "pawarlavi928@gmail.com";
    
    try {
        const result = await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.email, adminEmail))
            .returning();
            
        if (result.length > 0) {
            return NextResponse.json({ success: true, message: `${adminEmail} is now an admin. You can now visit /admin` });
        } else {
            return NextResponse.json({ error: "User not found in database. Please sign in to the app first so your account is created." }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
