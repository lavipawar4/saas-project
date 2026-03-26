import { InferSelectModel } from "drizzle-orm";
import { businesses, reviews, responses, subscriptions, customers, reviewRequests, users } from "@/lib/db/schema";

export type Profile = InferSelectModel<typeof users>;
export type Business = InferSelectModel<typeof businesses> & { locationCity?: string | null };
export type Review = InferSelectModel<typeof reviews>;
export type Response = InferSelectModel<typeof responses>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Customer = InferSelectModel<typeof customers>;
export type ReviewRequest = InferSelectModel<typeof reviewRequests>;

export type SubscriptionTier = "free" | "starter" | "pro";
export type BusinessTone = "professional" | "friendly" | "casual" | "empathetic" | "warm";
export type ReviewStatus = "pending" | "unanswered" | "draft" | "needs_review" | "published" | "auto_published" | "skipped";
export type ResponseStatus = "draft" | "editing" | "needs_review" | "published";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

// ─────────────────────────────────────────────
// Extended types with joins
// ─────────────────────────────────────────────
export interface ReviewWithResponse extends Review {
    responses?: Response | null;
    businesses?: Pick<Business, "name" | "tone" | "industry" | "keywords" | "ownerName" | "hipaaMode"> | null;
}

export interface BusinessWithStats extends Business {
    reviewCount?: number;
    publishedCount?: number;
    pendingCount?: number;
    avgStarRating?: number;
}

// ─────────────────────────────────────────────
// AI engine types (from spec)
// ─────────────────────────────────────────────
export type ResponseFlag =
    | "hipaa_check_needed"
    | "negative_review"
    | "owner_review_required"
    | "low_confidence"
    | "high_similarity";

export interface GeneratedResponse {
    response_text: string;
    confidence_score: number;
    variation_score: number;
    flags: ResponseFlag[];
    alternate_versions: string[];
}
