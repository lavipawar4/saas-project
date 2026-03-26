import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviews, businesses } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateReviewResponse } from "@/lib/ai/generate";
import { batchRatelimit, checkRateLimit } from "@/lib/redis/ratelimit";

export async function POST(request: NextRequest) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(batchRatelimit, `batch:${user.id}`);
    if (!rl.allowed) {
        const retryAfterSec = Math.ceil((rl.reset - Date.now()) / 1000);
        return NextResponse.json(
            { error: "Too many batch requests. Please wait before running another batch.", retryAfter: retryAfterSec },
            { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
        );
    }

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true }
    });

    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    let reviewIds: string[] | null = null;
    try {
        const body = await request.json();
        if (Array.isArray(body.reviewIds) && body.reviewIds.length > 0) {
            reviewIds = body.reviewIds;
        }
    } catch {
        // No body
    }

    let pendingReviews;
    if (reviewIds) {
        pendingReviews = await db.query.reviews.findMany({
            where: and(
                eq(reviews.businessId, business.id),
                inArray(reviews.id, reviewIds)
            ),
            columns: { id: true }
        });
    } else {
        pendingReviews = await db.query.reviews.findMany({
            where: and(
                eq(reviews.businessId, business.id),
                eq(reviews.status, "pending")
            ),
            columns: { id: true },
            limit: 50
        });
    }

    if (!pendingReviews || pendingReviews.length === 0) {
        return NextResponse.json({ message: "No pending reviews", generated: 0, results: [] });
    }

    const results: { reviewId: string; success: boolean; error?: string }[] = [];

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
