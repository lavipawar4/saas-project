import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/server";
import { sendNegativeReviewAlert } from "@/lib/email/alerts";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export function getGoogleAuthUrl(userId: string): string {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/business.manage",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: userId,
    });
}

export async function exchangeCodeForTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

async function getAuthenticatedClient(businessId: string) {
    const supabase = await createAdminClient();
    const { data: business } = await supabase
        .from("businesses")
        .select("google_account_token, google_access_token, google_refresh_token, google_token_expiry")
        .eq("id", businessId)
        .single();

    if (!business) {
        throw new Error("Business not found");
    }

    // Try JSONB first, fall back to legacy columns
    const tokenData = (business.google_account_token as any) || {
        access_token: business.google_access_token,
        refresh_token: business.google_refresh_token,
        expiry: business.google_token_expiry ? new Date(business.google_token_expiry).getTime() : undefined,
    };

    if (!tokenData?.access_token) {
        throw new Error("Business not connected to Google");
    }

    oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: typeof tokenData.expiry === 'number'
            ? tokenData.expiry
            : tokenData.expiry ? new Date(tokenData.expiry).getTime() : undefined,
    });

    // Auto-refresh if expired
    oauth2Client.on("tokens", async (tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }) => {
        if (tokens.access_token) {
            const currentToken = (business.google_account_token as any) || {};
            await supabase.from("businesses").update({
                google_account_token: {
                    ...currentToken,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token || currentToken.refresh_token,
                    expiry: tokens.expiry_date,
                    updated_at: new Date().toISOString(),
                },
                // Also update legacy columns for safety during transition
                google_access_token: tokens.access_token,
                google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            }).eq("id", businessId);
        }
    });

    return oauth2Client;
}

// ─── Exponential Backoff Utility ────────────────
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            const status = err?.response?.status || err?.status;

            // Only retry on 503 or transient network/rate limit issues
            if (i < maxRetries && (status === 503 || status === 429)) {
                const delay = Math.pow(2, i) * 1000;
                console.warn(`[Google API] ${status} error. Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

export async function syncReviews(businessId: string): Promise<{ synced: number; error?: string }> {
    const supabase = await createAdminClient();

    try {
        const auth = await getAuthenticatedClient(businessId);
        // Fetch business + owner info for alert emails
        const { data: business } = await supabase
            .from("businesses")
            .select("google_location_id, name, user_id")
            .eq("id", businessId)
            .single();

        if (!business?.google_location_id) {
            return { synced: 0, error: "No Google location ID set" };
        }

        // Call Google Business Profile API with retry
        // @ts-ignore -- googleapis v144 types don't expose mybusinessreviews as callable
        const mybusiness = google.mybusinessreviews({ version: "v4", auth });

        const response = await withRetry(() => mybusiness.accounts.locations.reviews.list({
            parent: business.google_location_id,
        })) as any;

        const reviews = response.data.reviews || [];
        let synced = 0;

        for (const review of reviews) {
            if (!review.reviewId) continue;

            // Check if this is a genuinely new review (no prior DB row)
            const { data: existing } = await supabase
                .from("reviews")
                .select("id, status")
                .eq("google_review_id", review.reviewId)
                .maybeSingle();

            const isNew = !existing;
            const starRating = mapStarRating(review.starRating);

            const { error } = await supabase.from("reviews").upsert({
                business_id: businessId,
                google_review_id: review.reviewId,
                reviewer_name: review.reviewer?.displayName || "Anonymous",
                reviewer_photo_url: review.reviewer?.profilePhotoUrl || null,
                star_rating: starRating,
                review_text: review.comment || null,
                review_reply: review.reviewReply?.comment || null,
                status: review.reviewReply ? "published" : "unanswered",
                google_created_at: review.createTime || null,
                synced_at: new Date().toISOString(),
            }, { onConflict: "google_review_id" });

            if (!error) {
                synced++;

                // Fire negative review alert for genuinely new 1-2 star reviews
                if (isNew && starRating <= 2 && !review.reviewReply) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("email, full_name")
                        .eq("id", business!.user_id)
                        .single();

                    if (profile?.email) {
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewai.app";
                        // Fire-and-forget — don't block sync
                        sendNegativeReviewAlert({
                            ownerEmail: profile.email,
                            ownerName: profile.full_name || "",
                            businessName: business!.name,
                            reviewerName: review.reviewer?.displayName || "Anonymous",
                            starRating,
                            reviewText: review.comment || null,
                            reviewDate: new Date(review.createTime || Date.now()).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric",
                            }),
                            dashboardUrl: appUrl + "/dashboard",
                        }).catch((e) => console.error("[Alert] Failed:", e));
                    }
                }
            }
        }

        // Update last synced time
        await supabase.from("businesses").update({
            last_synced_at: new Date().toISOString(),
        }).eq("id", businessId);

        return { synced };
    } catch (err: any) {
        const status = err?.response?.status || err?.status;
        const message = err?.response?.data?.error?.message || err.message || "Unknown error";
        console.error(`[Google API] Sync failed for ${businessId}:`, { status, message });
        return { synced: 0, error: `Google API Error: ${message}` };
    }
}

export async function publishReply(reviewId: string, replyText: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createAdminClient();

    const { data: review } = await supabase
        .from("reviews")
        .select("google_review_id, business_id, businesses(google_location_id)")
        .eq("id", reviewId)
        .single();

    if (!review) return { success: false, error: "Review not found" };

    try {
        const auth = await getAuthenticatedClient(review.business_id);
        const business = review.businesses as unknown as { google_location_id: string } | null;

        if (!business?.google_location_id) {
            return { success: false, error: "No Google location ID" };
        }

        // @ts-ignore -- googleapis v144 types don't expose mybusinessreviews as callable
        const mybusiness = google.mybusinessreviews({ version: "v4", auth });
        await withRetry(() => mybusiness.accounts.locations.reviews.updateReply({
            name: `${business.google_location_id}/reviews/${review.google_review_id}`,
            requestBody: { comment: replyText },
        }));

        // Update DB status
        await supabase.from("responses").update({
            status: "published",
            final_text: replyText,
            published_at: new Date().toISOString(),
        }).eq("review_id", reviewId);

        await supabase.from("reviews").update({ status: "published" }).eq("id", reviewId);

        return { success: true };
    } catch (err: any) {
        const status = err?.response?.status || err?.status;
        const message = err?.response?.data?.error?.message || err.message || "Unknown error";
        console.error(`[Google API] Publishing failed for review ${reviewId}:`, { status, message });
        return { success: false, error: `Google API Error: ${message}` };
    }
}

function mapStarRating(rating: string | null | undefined): number {
    const map: Record<string, number> = {
        ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };
    return map[rating || "FIVE"] || 5;
}
