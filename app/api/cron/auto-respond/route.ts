import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businesses, subscriptions, reviews, responses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateReviewResponse } from "@/lib/ai/generate";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const autoRespondBusinesses = await db.query.businesses.findMany({
        where: eq(businesses.autoRespond, true),
        columns: { id: true, name: true, userId: true }
    });

    if (!autoRespondBusinesses || autoRespondBusinesses.length === 0) {
        return NextResponse.json({ message: "No businesses with auto-respond enabled", processed: 0 });
    }

    let totalPublished = 0;
    let totalSkipped = 0;

    for (const business of autoRespondBusinesses) {
        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.userId, business.userId),
            columns: { plan: true, responsesUsedThisMonth: true, responsesLimit: true }
        });

        if (!sub || sub.plan !== "pro") continue;
        if (sub.responsesLimit !== -1 && sub.responsesUsedThisMonth >= sub.responsesLimit) continue;

        const pendingReviews = await db.query.reviews.findMany({
            where: and(
                eq(reviews.businessId, business.id),
                eq(reviews.status, "pending")
            ),
            columns: { id: true },
            limit: 20
        });

        if (!pendingReviews || pendingReviews.length === 0) continue;

        for (const review of pendingReviews) {
            try {
                const result = await generateReviewResponse(review.id);
                if (!result.success || !result.text) {
                    totalSkipped++;
                    continue;
                }

                // Auto-publish only if high quality
                const highQuality =
                    (result.generationCount ?? 1) === 1 &&
                    (result.confidence_score ?? 0) > 0.8 &&
                    (result.variation_score ?? 0) > 0.7;

                if (!highQuality) {
                    totalSkipped++;
                    continue;
                }

                const responseRow = await db.query.responses.findFirst({
                    where: eq(responses.reviewId, review.id),
                    columns: { draftText: true }
                });

                if (!responseRow?.draftText) {
                    totalSkipped++;
                    continue;
                }

                const { publishReply } = await import("@/lib/google/reviews");
                const publishResult = await publishReply(review.id, responseRow.draftText);

                if (publishResult.success) {
                    totalPublished++;
                    await db.update(responses)
                        .set({ publishedWithoutEdit: true, editDistancePct: 0 })
                        .where(eq(responses.reviewId, review.id));
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
        businesses: autoRespondBusinesses.length,
    });
}
