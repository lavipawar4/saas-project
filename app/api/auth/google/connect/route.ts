import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/reviews";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", request.url));

    const url = getGoogleAuthUrl(user.id);
    return NextResponse.redirect(url);
}
