import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe/client";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;
        if (!user || !user.id) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const url = await createPortalSession(user.id);
        return NextResponse.redirect(url);
    } catch {
        return NextResponse.redirect(new URL("/settings?error=billing", request.url));
    }
}
