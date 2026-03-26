"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { responses, reviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateReviewResponse } from "@/lib/ai/generate";
import { publishReply, syncReviews } from "@/lib/google/reviews";
import { generateRatelimit, checkRateLimit } from "@/lib/redis/ratelimit";

// Generate AI response for a review
export async function generateResponse(reviewId: string): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    generationCount?: number;
    similarityScore?: number;
    variation_score?: number;
    flags?: string[];
}> {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return { success: false, error: "Unauthorized" };

    const rl = await checkRateLimit(generateRatelimit, `generate:${user.id}`);
    if (!rl.allowed) {
        return { success: false, error: "Rate limit reached. Please wait a moment before generating another response." };
    }

    const result = await generateReviewResponse(reviewId);
    if (result.success) {
        revalidatePath(`/dashboard/reviews/${reviewId}`);
        revalidatePath("/dashboard");
    }

    let variation_score: number | undefined;
    let flags: string[] | undefined;
    if (result.success) {
        const resp = await db.query.responses.findFirst({
            where: eq(responses.reviewId, reviewId),
            columns: { variationScore: true, flags: true }
        });
        variation_score = resp?.variationScore ?? undefined;
        flags = resp?.flags ?? undefined;
    }

    return {
        success: result.success,
        text: result.text,
        error: result.error,
        generationCount: (result as { generationCount?: number }).generationCount,
        similarityScore: (result as { similarityScore?: number }).similarityScore,
        variation_score,
        flags,
    };
}

// Save edited response text
export async function saveResponseDraft(reviewId: string, text: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const session = await auth();
    const user = session?.user;
    if (!user) return { success: false, error: "Unauthorized" };

    if (text.length < 10) return { success: false, error: "Response too short" };
    if (text.length > 600) return { success: false, error: "Response too long (max 600 chars)" };

    try {
        await db.update(responses)
            .set({ draftText: text, status: "editing", updatedAt: new Date() })
            .where(eq(responses.reviewId, reviewId));

        revalidatePath(`/dashboard/reviews/${reviewId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Publish response to Google Business Profile
export async function publishResponse(reviewId: string, text: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const session = await auth();
    const user = session?.user;
    if (!user) return { success: false, error: "Unauthorized" };

    const result = await publishReply(reviewId, text);
    if (result.success) {
        try {
            await db.update(responses)
                .set({ finalText: text, updatedAt: new Date() })
                .where(eq(responses.reviewId, reviewId));

            revalidatePath(`/dashboard/reviews/${reviewId}`);
            revalidatePath("/dashboard");
        } catch (error: any) {
            return { success: true, error: "Published but failed to save in DB: " + error.message };
        }
    }
    return result;
}

// Trigger manual review sync
export async function triggerReviewSync(businessId: string): Promise<{
    success: boolean;
    synced?: number;
    error?: string;
}> {
    const session = await auth();
    const user = session?.user;
    if (!user) return { success: false, error: "Unauthorized" };

    const result = await syncReviews(businessId);
    if (result.synced !== undefined) {
        revalidatePath("/dashboard");
        return { success: true, synced: result.synced };
    }
    return { success: false, error: result.error };
}

// Skip a review (mark as not needing response)
export async function skipReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    const user = session?.user;
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await db.update(reviews)
            .set({ status: "skipped" })
            .where(eq(reviews.id, reviewId));

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
