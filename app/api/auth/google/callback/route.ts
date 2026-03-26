import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google/reviews";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const userId = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=google_denied`);
    }

    if (!code || !userId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=missing_params`);
    }

    try {
        const tokens = await exchangeCodeForTokens(code);

        const existing = await db.query.businesses.findFirst({
            where: eq(businesses.userId, userId),
            columns: { id: true }
        });

        if (existing) {
            await db.update(businesses).set({
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                isConnected: true,
            }).where(eq(businesses.id, existing.id));
        } else {
            await db.insert(businesses).values({
                userId,
                name: "My Business",
                industry: "general",
                tone: "professional",
                keywords: [],
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                isConnected: true,
            });
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=2&connected=true`);
    } catch {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=token_exchange_failed`);
    }
}
