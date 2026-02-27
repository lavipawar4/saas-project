import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNegativeReviewAlert } from "@/lib/email/alerts";

/**
 * Dev/test endpoint to preview the negative review alert email.
 * Call: GET /api/webhooks/test-email?to=you@example.com
 * Protected by CRON_SECRET to prevent abuse.
 */
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const to = request.nextUrl.searchParams.get("to") || user?.email;
    if (!to) return NextResponse.json({ error: "No recipient email. Pass ?to=email or be logged in." }, { status: 400 });

    const result = await sendNegativeReviewAlert({
        ownerEmail: to,
        ownerName: "John Smith",
        businessName: "Smith's Italian Kitchen",
        reviewerName: "Angry Customer",
        starRating: 1,
        reviewText: "Absolutely terrible experience. The food was cold, the service was slow, and nobody seemed to care. I will never be coming back.",
        reviewDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        dashboardUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/dashboard",
    });

    return NextResponse.json({ sent: result.success, to, ...result });
}
