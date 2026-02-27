import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { plan } = await request.json();
        if (!plan || !["starter", "pro"].includes(plan)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const url = await createCheckoutSession(user.id, plan, user.email || "");
        return NextResponse.json({ url });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
