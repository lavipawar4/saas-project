import { createAdminClient } from "@/lib/supabase/server";
import { getIndustryExamples } from "@/lib/ai/examples";
import { jaccardSimilarity, validateResponse } from "./validator";
import { INDUSTRY_PRESETS, TONE_GUIDES } from "./presets";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ResponseFlag =
    | "hipaa_check_needed"
    | "negative_review"
    | "owner_review_required"
    | "low_confidence"
    | "high_similarity"
    | "quality_check_failed";

interface ReviewGenerationRequest {
    reviewer_name: string;
    star_rating: 1 | 2 | 3 | 4 | 5;
    review_text: string;
    business_profile: {
        id: string;
        name: string;
        industry: string;
        tone: string;
        keywords: string[];
        hipaa_mode: boolean;
        owner_name: string;
        location_city: string; // For Local SEO
    };
    recent_responses: string[];     // Last 5 for this business (variety)
    history_responses: string[];    // Last 10 published across business (context)
    response_length: "short" | "medium" | "long";
}

// ─────────────────────────────────────────────
// Word-count targets per length pref
// ─────────────────────────────────────────────
const LENGTH_TARGETS: Record<string, { min: number; max: number }> = {
    short: { min: 50, max: 70 },
    medium: { min: 80, max: 120 },
    long: { min: 130, max: 180 },
};

// ─────────────────────────────────────────────
// Star-rating strategy blocks
// ─────────────────────────────────────────────
function starStrategy(starRating: number, ownerName: string): string {
    const signOff = ownerName
        ? `End with a warm sign-off from ${ownerName} or the team.`
        : "End with a warm sign-off from the team.";

    switch (starRating) {
        case 5:
            return `STRATEGY (5-STAR): Express genuine appreciation. Echo a specific detail the reviewer mentioned. Include a forward-looking statement. ${signOff}`;
        case 4:
            return `STRATEGY (4-STAR): Thank them sincerely. Acknowledge the positive. Softly ask what would make their next experience a 5-star one. ${signOff}`;
        case 3:
            return `STRATEGY (3-STAR): Thank them for honest feedback. Acknowledge both what worked and what fell short. Invite them to reach out directly. ${signOff}`;
        case 1:
        case 2:
            return `STRATEGY (${starRating}-STAR): Respond calmly. Acknowledge their experience. Offer to take the conversation offline. End with a sincere statement of wanting to make it right. ${signOff}`;
        default:
            return signOff;
    }
}

// ─────────────────────────────────────────────
// Master system prompt
// ─────────────────────────────────────────────
function buildSystemPrompt(req: ReviewGenerationRequest, isSimilarityRetry: boolean): string {
    const { min, max } = LENGTH_TARGETS[req.response_length] ?? LENGTH_TARGETS.medium;

    const keywordsText = req.business_profile.keywords.length > 0
        ? req.business_profile.keywords.join(", ")
        : "(none specified)";

    const recentOpeners = req.recent_responses.length > 0
        ? req.recent_responses
            .slice(0, 5)
            .map((r, i) => `  ${i + 1}. "${r.substring(0, 60).trim()}…"`)
            .join("\n")
        : "  (none yet)";

    const hipaaBlock = req.business_profile.hipaa_mode
        ? `[HIPAA COMPLIANCE]: Do NOT confirm any specific treatment or health info. Acknowledge general experience only.`
        : "";

    // SEO Injection Logic
    const includeBusinessName = Math.random() < 0.45; // ~40-50% frequency
    const locationMention = req.business_profile.location_city
        ? `Naturally mention our location in ${req.business_profile.location_city} if it fits (e.g., "here in ${req.business_profile.location_city}" or "our ${req.business_profile.location_city} location").`
        : "";

    const retryBlock = isSimilarityRetry
        ? `\n⚠️ STRICT VARIATION REQUIRED: Your previous attempt was too similar to recent responses. 
           Change your opening words, sentence structure, and vocabulary completely. 
           Do NOT use any of the same phrases found in the list below.`
        : "";

    const examples = getIndustryExamples(req.business_profile.industry);
    const examplesBlock = examples
        .slice(0, 2)
        .map((ex, i) =>
            `EXAMPLE ${i + 1} (${ex.rating}★)\nReview: "${ex.review}"\nIdeal Response: ${ex.response}`
        )
        .join("\n\n");

    const toneInstruction = TONE_GUIDES[req.business_profile.tone] || `Match this tone: ${req.business_profile.tone}`;

    return `You are an expert customer relations specialist for "${req.business_profile.name}".
Write a warm, natural response to a Google review.

STYLE GUIDE:
${toneInstruction}

SEO INJECTION (SOFT INSTRUCTIONS):
1. ${includeBusinessName ? `Naturally include the business name ("${req.business_profile.name}") once.` : `Do not explicitly mention the business name this time.`}
2. ${locationMention}
3. Keywords to weave in: ${keywordsText}
4. Include a soft call-to-action (e.g., "See you again soon", "Don't hesitate to call if you need anything").

ANTI-SPAM RULES:
- NEVER keyword-stuff. The response must sound like a human wrote it.
- Avoid robotic repetition of the business name or location.
- If a keyword doesn't fit naturally, skip it.

RULES:
1. Open with the reviewer's name (e.g., "Hi [NAME]," or "Thank you, [NAME]!")
2. Reference specific details from their review.
3. Match this tone: ${req.business_profile.tone}
4. Word count: ${min} to ${max} words.
5. End with a warm sign-off from ${req.business_profile.owner_name || "the team"}.
6. NO boilerplate like "Thank you for your review".
7. NO overused words: "fantastic", "amazing".
8. Max 2 emojis.
9. NO URLs.

RECENT RESPONSES (DO NOT CLONE):
${recentOpeners}

${hipaaBlock}
${retryBlock}

${starStrategy(req.star_rating, req.business_profile.owner_name)}

---
INDUSTRY EXAMPLES:
${examplesBlock}
---

Output only the response.`;
}

// ─────────────────────────────────────────────
// Single generation call
// ─────────────────────────────────────────────
async function generateSingleVariant(
    req: ReviewGenerationRequest,
    isSimilarityRetry: boolean
): Promise<string> {
    const systemPrompt = buildSystemPrompt(req, isSimilarityRetry);
    const userPrompt = `Write a response to this ${req.star_rating}-star review from ${req.reviewer_name}:\n\n"${req.review_text || "(No text rating)"}"`;

    // Dynamic import to prevent build-time initialization errors
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || "dummy-key-for-build",
    });

    const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    return content.type === "text" ? content.text.trim() : "";
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export async function generateReviewResponse(reviewId: string): Promise<{
    success: boolean;
    text?: string;
    confidence_score?: number;
    variation_score?: number;
    flags?: ResponseFlag[];
    generationCount?: number;
    error?: string;
}> {
    const supabase = await createAdminClient();

    const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .select(`
          *,
          businesses (
            id, name, industry, tone, keywords, user_id,
            owner_name, hipaa_mode, response_length, location_city
          )
        `)
        .eq("id", reviewId)
        .single();

    if (reviewError || !review) return { success: false, error: "Review not found" };

    const biz = review.businesses as {
        id: string; name: string; industry: string; tone: string;
        keywords: string[]; user_id: string; owner_name: string;
        hipaa_mode: boolean; response_length: "short" | "medium" | "long";
        location_city: string | null;
    };

    // Subscription guard
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("responses_used_this_month, responses_limit, plan")
        .eq("user_id", biz.user_id)
        .single();

    if (
        subscription &&
        subscription.responses_limit !== -1 &&
        subscription.responses_used_this_month >= subscription.responses_limit
    ) {
        return {
            success: false,
            error: `Monthly limit reached (${subscription.responses_limit} responses). Please upgrade your plan.`,
        };
    }

    // Fetch last 5 published responses for THIS business for similarity check
    const { data: historyRows } = await supabase
        .from("responses")
        .select("final_text")
        .eq("business_id", biz.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5);

    const historyResponses = historyRows?.map((r: { final_text: string }) => r.final_text).filter(Boolean) || [];

    const req: ReviewGenerationRequest = {
        reviewer_name: review.reviewer_name,
        star_rating: review.star_rating as 1 | 2 | 3 | 4 | 5,
        review_text: review.review_text || "",
        business_profile: {
            id: biz.id,
            name: biz.name,
            industry: biz.industry,
            tone: biz.tone,
            keywords: biz.keywords || [],
            hipaa_mode: biz.hipaa_mode || false,
            owner_name: biz.owner_name || "",
            location_city: biz.location_city || "",
        },
        recent_responses: historyResponses,
        history_responses: [], // Not used for now
        response_length: biz.response_length || "medium",
    };

    let finalResponse = "";
    let generationCount = 0;
    let avgSimilarity = 0;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        generationCount++;
        const isRetry = attempt > 0;
        let text = await generateSingleVariant(req, isRetry);

        if (!text) continue;

        // Similarity Check
        if (historyResponses.length > 0) {
            const scores = historyResponses.map(prev => jaccardSimilarity(text, prev));
            avgSimilarity = scores.reduce((a, b) => a + b, 0) / scores.length;

            if (avgSimilarity > 0.40 && attempt < 2) {
                // Too similar, retry with stricter instructions
                continue;
            }
        }

        // QA Validations
        const qa = validateResponse(text, req.reviewer_name, biz.hipaa_mode);
        text = qa.fixedText;

        if (qa.shouldRegenerate && attempt < 2) {
            continue;
        }

        finalResponse = text;
        break;
    }

    if (!finalResponse) {
        return { success: false, error: "Failed to generate quality response after retries." };
    }

    // Scoring & Flags
    const variationScore = 1 - avgSimilarity;
    const finalQA = validateResponse(finalResponse, req.reviewer_name, biz.hipaa_mode);
    const flags: ResponseFlag[] = [];
    if (!finalQA.passed) flags.push("quality_check_failed");
    if (avgSimilarity > 0.35) flags.push("high_similarity");
    if (biz.hipaa_mode) flags.push("hipaa_check_needed");
    if (review.star_rating <= 2) {
        flags.push("negative_review");
        flags.push("owner_review_required");
    }

    const confidenceScore = Math.max(0, 1 - (avgSimilarity * 0.5) - (generationCount * 0.1));
    if (confidenceScore < 0.5) flags.push("low_confidence");

    // Persist
    const status = review.star_rating <= 2 ? "needs_review" : "draft";

    const { error: upsertError } = await supabase
        .from("responses")
        .upsert({
            review_id: reviewId,
            draft_text: finalResponse,
            status: status,
            ai_model: "claude-3-5-sonnet-20241022",
            generation_count: generationCount,
            similarity_score: avgSimilarity,
            variation_score: variationScore,
            confidence_score: confidenceScore,
            flags,
            qa_passed: finalQA.passed,
            updated_at: new Date().toISOString(),
        }, { onConflict: "review_id" });

    if (upsertError) {
        return { success: false, error: `Failed to save response: ${upsertError.message}` };
    }

    await supabase.from("reviews").update({ status }).eq("id", reviewId);

    if (subscription) {
        await supabase
            .from("subscriptions")
            .update({ responses_used_this_month: subscription.responses_used_this_month + 1 })
            .eq("user_id", biz.user_id);
    }

    return {
        success: true,
        text: finalResponse,
        confidence_score: confidenceScore,
        variation_score: variationScore,
        flags,
        generationCount
    };
}
