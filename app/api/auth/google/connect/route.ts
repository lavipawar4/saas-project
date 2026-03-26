import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/reviews";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return NextResponse.redirect(new URL("/login", request.url));

    const url = getGoogleAuthUrl(user.id);
    return NextResponse.redirect(url);
}
