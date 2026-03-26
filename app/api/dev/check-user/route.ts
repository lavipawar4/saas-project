import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Not logged in" });

    try {
        const dbUser = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });
        
        return NextResponse.json({ 
            sessionUser: session.user,
            dbUser: dbUser,
            match: session.user.role === dbUser?.role
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
