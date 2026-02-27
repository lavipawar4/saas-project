import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReviewResponse } from "@/lib/ai/generate";
import { batchRatelimit, checkRateLimit } from "@/lib/redis/ratelimit";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: 3 batch runs per user per 10 minutes
    const rl = await checkRateLimit(batchRatelimit, `batch:${user.id}`);
    if (!rl.allowed) {
        const retryAfterSec = Math.ceil((rl.reset - Date.now()) / 1000);
        return NextResponse.json(
            { error: "Too many batch requests. Please wait before running another batch.", retryAfter: retryAfterSec },
            { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
        );
    }

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Optional: caller can pass specific review IDs to batch-generate
    let reviewIds: string[] | null = null;
    try {
        const body = await request.json();
        if (Array.isArray(body.reviewIds) && body.reviewIds.length > 0) {
            reviewIds = body.reviewIds;
        }
    } catch {
        // No body — generate for all pending
    }

    // Fetch pending reviews for this business
    let query = supabase
        .from("reviews")
        .select("id")
        .eq("business_id", business.id)
        .eq("status", "pending")
        .limit(50);

    if (reviewIds) {
        query = supabase
            .from("reviews")
            .select("id")
            .eq("business_id", business.id)
            .in("id", reviewIds);
    }

    const { data: pendingReviews } = await query;

    if (!pendingReviews || pendingReviews.length === 0) {
        return NextResponse.json({ message: "No pending reviews", generated: 0, results: [] });
    }

    const results: { reviewId: string; success: boolean; error?: string }[] = [];

    // Stream-friendly: generate sequentially to avoid hitting rate limits
    for (const review of pendingReviews) {
        const result = await generateReviewResponse(review.id);
        results.push({
            reviewId: review.id,
            success: result.success,
            error: result.error,
        });
    }

    const generated = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ generated, failed, total: pendingReviews.length, results });
}
