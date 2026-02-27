"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Rate limit: 20 single generations per user per minute
    const rl = await checkRateLimit(generateRatelimit, `generate:${user.id}`);
    if (!rl.allowed) {
        return { success: false, error: "Rate limit reached. Please wait a moment before generating another response." };
    }

    const result = await generateReviewResponse(reviewId);
    if (result.success) {
        revalidatePath(`/dashboard/reviews/${reviewId}`);
        revalidatePath("/dashboard");
    }

    // Fetch updated response row to get newly stored variation_score + flags
    let variation_score: number | undefined;
    let flags: string[] | undefined;
    if (result.success) {
        const { data: resp } = await supabase
            .from("responses")
            .select("variation_score, flags")
            .eq("review_id", reviewId)
            .single();
        variation_score = resp?.variation_score ?? undefined;
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (text.length < 10) return { success: false, error: "Response too short" };
    if (text.length > 600) return { success: false, error: "Response too long (max 600 chars)" };

    const { error } = await supabase
        .from("responses")
        .update({ draft_text: text, status: "editing", updated_at: new Date().toISOString() })
        .eq("review_id", reviewId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/reviews/${reviewId}`);
    return { success: true };
}

// Publish response to Google Business Profile
export async function publishResponse(reviewId: string, text: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const result = await publishReply(reviewId, text);
    if (result.success) {
        // Set final_text — DB trigger auto-sets was_edited if it differs from draft_text
        await supabase
            .from("responses")
            .update({ final_text: text, updated_at: new Date().toISOString() })
            .eq("review_id", reviewId);

        revalidatePath(`/dashboard/reviews/${reviewId}`);
        revalidatePath("/dashboard");
    }
    return result;
}

// Trigger manual review sync
export async function triggerReviewSync(businessId: string): Promise<{
    success: boolean;
    synced?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("reviews")
        .update({ status: "skipped" })
        .eq("id", reviewId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    return { success: true };
}
