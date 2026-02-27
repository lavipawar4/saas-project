import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateReviewResponse } from "@/lib/ai/generate";

// Vercel Cron or external scheduler hits this endpoint
// Secured with CRON_SECRET header
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Find all businesses that have auto_respond enabled (Pro users only)
    const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, user_id")
        .eq("auto_respond", true);

    if (!businesses || businesses.length === 0) {
        return NextResponse.json({ message: "No businesses with auto-respond enabled", processed: 0 });
    }

    let totalPublished = 0;
    let totalSkipped = 0;

    for (const business of businesses) {
        // Verify Pro subscription
        const { data: sub } = await supabase
            .from("subscriptions")
            .select("plan, responses_used_this_month, responses_limit")
            .eq("user_id", business.user_id)
            .single();

        if (!sub || sub.plan !== "pro") continue;
        if (sub.responses_limit !== -1 && sub.responses_used_this_month >= sub.responses_limit) continue;

        // Find pending reviews for this business
        const { data: pendingReviews } = await supabase
            .from("reviews")
            .select("id")
            .eq("business_id", business.id)
            .eq("status", "pending")
            .limit(20); // Safety cap per run

        if (!pendingReviews || pendingReviews.length === 0) continue;

        for (const review of pendingReviews) {
            try {
                const result = await generateReviewResponse(review.id);
                if (!result.success || !result.text) {
                    totalSkipped++;
                    continue;
                }

                // Auto-publish only if generation quality is high
                const highQuality =
                    (result.generationCount ?? 1) === 1 &&
                    (result.confidence_score ?? 0) > 0.8 &&
                    (result.variation_score ?? 0) > 0.7;

                if (!highQuality) {
                    totalSkipped++;
                    continue;
                }

                // Publish the response directly to Google — fetch draft text first
                const { data: responseRow } = await supabase
                    .from("responses")
                    .select("draft_text")
                    .eq("review_id", review.id)
                    .single();

                if (!responseRow?.draft_text) {
                    totalSkipped++;
                    continue;
                }

                const { publishReply } = await import("@/lib/google/reviews");
                const publishResult = await publishReply(review.id, responseRow.draft_text);

                if (publishResult.success) {
                    totalPublished++;
                    // Mark as auto-published
                    await supabase.from("responses").update({
                        published_without_edit: true,
                        edit_distance_pct: 0,
                    }).eq("review_id", review.id);
                } else {
                    totalSkipped++;
                }
            } catch {
                totalSkipped++;
            }
        }
    }

    return NextResponse.json({
        message: `Auto-respond complete`,
        published: totalPublished,
        skipped: totalSkipped,
        businesses: businesses.length,
    });
}
