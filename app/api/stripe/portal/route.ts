import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const url = await createPortalSession(user.id);
        return NextResponse.redirect(url);
    } catch {
        return NextResponse.redirect(new URL("/settings?error=billing", request.url));
    }
}
