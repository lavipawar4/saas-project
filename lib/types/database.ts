// Database types aligned with spec + all migrations
// Last updated: migration 005_schema_alignment

export type SubscriptionTier = "free" | "starter" | "pro";
export type BusinessTone = "professional" | "friendly" | "casual" | "empathetic" | "warm";
export type ReviewStatus =
    | "pending"       // Initial state on sync
    | "unanswered"    // Spec alias for pending
    | "draft"         // AI response generated, awaiting review
    | "needs_review"  // Generated for 1-2★ review — owner must review before publish
    | "published"     // Response published to Google
    | "auto_published"// Auto-published by cron (Pro, auto_respond = true)
    | "skipped";      // User chose not to respond
export type ResponseStatus = "draft" | "editing" | "needs_review" | "published";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    stripe_customer_id: string | null;
    subscription_tier: SubscriptionTier;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface Business {
    id: string;
    user_id: string;
    name: string;
    industry: string;
    tone: BusinessTone;
    keywords: string[];
    owner_name: string | null;                  // Used in AI sign-offs
    hipaa_mode: boolean;                        // HIPAA-safe generation
    response_length: "short" | "medium" | "long" | null;
    auto_respond: boolean;                      // Pro: auto-publish cron
    location_city: string | null;               // Local SEO: "here in [City]"
    // Google connection (legacy split fields — kept for backwards compat)
    google_account_id: string | null;
    google_location_id: string | null;
    google_location_name: string | null;
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expiry: string | null;
    // Spec: consolidated token JSONB
    google_account_token: Record<string, string> | null;
    is_connected: boolean;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: string;
    business_id: string;
    google_review_id: string;
    reviewer_name: string;
    reviewer_photo_url: string | null;
    star_rating: 1 | 2 | 3 | 4 | 5;
    review_text: string | null;
    review_reply: string | null;
    status: ReviewStatus;
    google_created_at: string | null;   // Original column
    review_date: string | null;         // Spec alias (generated, mirrors google_created_at)
    synced_at: string;
    created_at: string;
    updated_at: string;
}

export interface Response {
    id: string;
    review_id: string;
    business_id: string | null;         // Spec: direct business FK (backfilled)
    // Spec column names
    generated_text: string | null;      // Original AI output (immutable after generation)
    final_text: string | null;          // What was actually published (may differ if edited)
    generation_model: string | null;    // Spec alias for ai_model
    was_edited: boolean;                // True when final_text differs from generated_text
    // Legacy / extended columns (retained)
    draft_text: string;                 // Working draft (write target)
    ai_model: string;
    generation_count: number;
    similarity_score: number | null;
    confidence_score: number | null;    // 0-1 quality score
    variation_score: number | null;     // 0-1 difference from recent responses
    flags: string[];                    // negative_review | owner_review_required | etc.
    alternate_versions: string[];       // 2 AI-generated alternatives
    qa_passed: boolean;
    status: ResponseStatus;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    plan: SubscriptionTier;
    // Usage counters
    responses_used_this_month: number;  // Write target
    responses_this_month: number;       // Spec alias (generated column)
    responses_limit: number;
    // Dates (legacy + spec aliases)
    period_start: string | null;
    period_end: string | null;          // Write target
    current_period_end: string | null;  // Spec alias (generated column)
    status: SubscriptionStatus;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────
// Extended types with joins
// ─────────────────────────────────────────────
export interface ReviewWithResponse extends Review {
    responses?: Response | null;
    businesses?: Pick<Business, "name" | "tone" | "industry" | "keywords" | "owner_name" | "hipaa_mode"> | null;
}

export interface BusinessWithStats extends Business {
    review_count?: number;
    published_count?: number;
    pending_count?: number;
    avg_star_rating?: number;
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

export interface Customer {
    id: string;
    business_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    tags: string[];
    last_interaction_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReviewRequest {
    id: string;
    customer_id: string;
    business_id: string;
    status: "pending" | "sent" | "opened" | "clicked" | "reviewed" | "failed";
    sent_at: string | null;
    email_id: string | null;
    created_at: string;
    updated_at: string;
}
