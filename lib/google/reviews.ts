import { google } from "googleapis";
import { db } from "@/lib/db";
import { businesses, reviews, users, responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendNegativeReviewAlert } from "@/lib/email/alerts";

const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
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
    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { googleAccountToken: true, googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true }
    });

    if (!business) {
        throw new Error("Business not found");
    }

    const tokenData = (business.googleAccountToken as any) || {
        access_token: business.googleAccessToken,
        refresh_token: business.googleRefreshToken,
        expiry: business.googleTokenExpiry ? new Date(business.googleTokenExpiry).getTime() : undefined,
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

    oauth2Client.on("tokens", async (tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }) => {
        if (tokens.access_token) {
            const currentToken = (business.googleAccountToken as any) || {};
            await db.update(businesses).set({
                googleAccountToken: {
                    ...currentToken,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token || currentToken.refresh_token,
                    expiry: tokens.expiry_date,
                    updated_at: new Date().toISOString(),
                },
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            }).where(eq(businesses.id, businessId));
        }
    });

    return oauth2Client;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            const status = err?.response?.status || err?.status;

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
    try {
        const auth = await getAuthenticatedClient(businessId);
        
        const business = await db.query.businesses.findFirst({
            where: eq(businesses.id, businessId),
            columns: { googleLocationId: true, name: true, userId: true, autoRespond: true }
        });

        if (!business?.googleLocationId) {
            return { synced: 0, error: "No Google location ID set" };
        }

        const { generateReviewResponse } = await import("@/lib/ai/generate");

        // @ts-ignore
        const mybusiness = google.mybusinessreviews({ version: "v4", auth });

        const response = await withRetry(() => mybusiness.accounts.locations.reviews.list({
            parent: business.googleLocationId!,
        })) as any;

        const googleReviewsList = response.data.reviews || [];
        let synced = 0;

        for (const review of googleReviewsList) {
            if (!review.reviewId) continue;

            const existing = await db.query.reviews.findFirst({
                where: eq(reviews.googleReviewId, review.reviewId),
                columns: { id: true, status: true }
            });

            const isNew = !existing;
            const starRating = mapStarRating(review.starRating);

            let insertedReviewId = existing?.id;

            if (existing) {
                await db.update(reviews).set({
                    reviewerName: review.reviewer?.displayName || "Anonymous",
                    reviewerPhotoUrl: review.reviewer?.profilePhotoUrl || null,
                    starRating,
                    reviewText: review.comment || null,
                    reviewReply: review.reviewReply?.comment || null,
                    status: review.reviewReply ? "published" : existing.status,
                    googleCreatedAt: review.createTime ? new Date(review.createTime) : null,
                    syncedAt: new Date(),
                }).where(eq(reviews.id, existing.id));
            } else {
                const [newReview] = await db.insert(reviews).values({
                    businessId,
                    googleReviewId: review.reviewId,
                    reviewerName: review.reviewer?.displayName || "Anonymous",
                    reviewerPhotoUrl: review.reviewer?.profilePhotoUrl || null,
                    starRating,
                    reviewText: review.comment || null,
                    reviewReply: review.reviewReply?.comment || null,
                    status: review.reviewReply ? "published" : "unanswered",
                    googleCreatedAt: review.createTime ? new Date(review.createTime) : null,
                    syncedAt: new Date(),
                }).returning({ id: reviews.id });
                insertedReviewId = newReview.id;
                synced++;
            }

            if (insertedReviewId) {
                if (isNew && starRating <= 2 && !review.reviewReply) {
                    const profile = await db.query.users.findFirst({
                        where: eq(users.id, business.userId),
                        columns: { email: true, name: true }
                    });

                    if (profile?.email) {
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewai.app";
                        sendNegativeReviewAlert({
                            ownerEmail: profile.email,
                            ownerName: profile.name || "",
                            businessName: business.name,
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

                if (isNew && !review.reviewReply && business.autoRespond) {
                    try {
                        const genResult = await generateReviewResponse(insertedReviewId);

                        if (genResult.success && genResult.text) {
                            console.log(`[Full-Auto] Automatically publishing response for review ${insertedReviewId} (${starRating} stars)`);
                            await publishReply(insertedReviewId, genResult.text);
                        }
                    } catch (genErr) {
                        console.error(`[Full-Auto] Failed for review ${insertedReviewId}:`, genErr);
                    }
                }
            }
        }

        await db.update(businesses)
            .set({ lastSyncedAt: new Date() })
            .where(eq(businesses.id, businessId));

        return { synced };
    } catch (err: any) {
        const message = err?.response?.data?.error?.message || err.message || "Unknown error";
        return { synced: 0, error: `Google API Error: ${message}` };
    }
}

export async function publishReply(reviewId: string, replyText: string): Promise<{ success: boolean; error?: string }> {
    const reviewRow = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
        columns: { googleReviewId: true, businessId: true },
        with: {
            business: { columns: { googleLocationId: true } }
        }
    });

    if (!reviewRow || !reviewRow.business) return { success: false, error: "Review not found" };

    try {
        const auth = await getAuthenticatedClient(reviewRow.businessId);

        if (!reviewRow.business.googleLocationId) {
            return { success: false, error: "No Google location ID" };
        }

        // @ts-ignore
        const mybusiness = google.mybusinessreviews({ version: "v4", auth });
        await withRetry(() => mybusiness.accounts.locations.reviews.updateReply({
            name: `${reviewRow.business.googleLocationId}/reviews/${reviewRow.googleReviewId}`,
            requestBody: { comment: replyText },
        }));

        await db.update(responses)
            .set({ status: "published", finalText: replyText, publishedAt: new Date() })
            .where(eq(responses.reviewId, reviewId));

        await db.update(reviews)
            .set({ status: "published" })
            .where(eq(reviews.id, reviewId));

        return { success: true };
    } catch (err: any) {
        const message = err?.response?.data?.error?.message || err.message || "Unknown error";
        return { success: false, error: `Google API Error: ${message}` };
    }
}

function mapStarRating(rating: string | null | undefined): number {
    const map: Record<string, number> = {
        ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };
    return map[rating || "FIVE"] || 5;
}
