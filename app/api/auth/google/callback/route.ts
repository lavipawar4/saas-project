import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google/reviews";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const userId = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=google_denied`
        );
    }

    if (!code || !userId) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=missing_params`
        );
    }

    try {
        const tokens = await exchangeCodeForTokens(code);
        const supabase = await createAdminClient();

        // Upsert business with Google tokens
        const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (existing) {
            await supabase.from("businesses").update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: tokens.expiry_date
                    ? new Date(tokens.expiry_date).toISOString()
                    : null,
                is_connected: true,
            }).eq("id", existing.id);
        } else {
            await supabase.from("businesses").insert({
                user_id: userId,
                name: "My Business",
                industry: "general",
                tone: "professional",
                keywords: [],
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: tokens.expiry_date
                    ? new Date(tokens.expiry_date).toISOString()
                    : null,
                is_connected: true,
            });
        }

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=2&connected=true`
        );
    } catch {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=token_exchange_failed`
        );
    }
}
