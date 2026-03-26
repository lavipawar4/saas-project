import { db } from "@/lib/db";
import { businesses, reviews, subscriptions, responses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getIndustryExamples } from "@/lib/ai/examples";
import { jaccardSimilarity, validateResponse } from "./validator";
import { INDUSTRY_PRESETS, TONE_GUIDES } from "./presets";

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
        location_city: string;
    };
    recent_responses: string[];
    history_responses: string[];
    response_length: "short" | "medium" | "long";
}

const LENGTH_TARGETS: Record<string, { min: number; max: number }> = {
    short: { min: 50, max: 70 },
    medium: { min: 80, max: 120 },
    long: { min: 130, max: 180 },
};

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
            return `STRATEGY (${starRating}-STAR): Respond calmly and professionally. Acknowledge their experience. Explicitly state that "we are working on this issue" or "we are taking steps to improve". Offer to take the conversation offline. End with a sincere statement of wanting to make it right. ${signOff}`;
        default:
            return signOff;
    }
}

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

    const includeBusinessName = Math.random() < 0.45;
    const locationMention = req.business_profile.location_city
        ? `Naturally mention our location in ${req.business_profile.location_city} if it fits.`
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

async function generateSingleVariant(
    req: ReviewGenerationRequest,
    isSimilarityRetry: boolean
): Promise<string> {
    const systemPrompt = buildSystemPrompt(req, isSimilarityRetry);
    const userPrompt = `Write a response to this ${req.star_rating}-star review from ${req.reviewer_name}:\n\n"${req.review_text || "(No text rating)"}"`;

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

export async function generateReviewResponse(reviewId: string): Promise<{
    success: boolean;
    text?: string;
    confidence_score?: number;
    variation_score?: number;
    flags?: ResponseFlag[];
    generationCount?: number;
    error?: string;
}> {
    const reviewRow = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
        with: {
            business: true
        }
    });

    if (!reviewRow || !reviewRow.business) return { success: false, error: "Review not found" };

    const biz = reviewRow.business;

    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, biz.userId),
        columns: { responsesUsedThisMonth: true, responsesLimit: true, plan: true }
    });

    if (
        subscription &&
        subscription.responsesLimit !== -1 &&
        subscription.responsesUsedThisMonth >= subscription.responsesLimit
    ) {
        return {
            success: false,
            error: `Monthly limit reached (${subscription.responsesLimit} responses). Please upgrade your plan.`,
        };
    }

    const historyRows = await db.query.responses.findMany({
        where: eq(responses.businessId, biz.id),
        columns: { finalText: true },
        orderBy: [desc(responses.createdAt)],
        limit: 5
    });

    const historyResponses = historyRows.map((r: any) => r.finalText).filter(Boolean) || [];

    const req: ReviewGenerationRequest = {
        reviewer_name: reviewRow.reviewerName || "Customer",
        star_rating: reviewRow.starRating as 1 | 2 | 3 | 4 | 5,
        review_text: reviewRow.reviewText || "",
        business_profile: {
            id: biz.id,
            name: biz.name,
            industry: biz.industry,
            tone: biz.tone,
            keywords: biz.keywords || [],
            hipaa_mode: biz.hipaaMode || false,
            owner_name: biz.ownerName || "",
            location_city: biz.googleLocationName || "",
        },
        recent_responses: historyResponses,
        history_responses: [], 
        response_length: (biz.responseLength as any) || "medium",
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

        if (historyResponses.length > 0) {
            const scores = historyResponses.map(prev => jaccardSimilarity(text, prev));
            avgSimilarity = scores.reduce((a, b) => a + b, 0) / scores.length;

            if (avgSimilarity > 0.40 && attempt < 2) {
                continue;
            }
        }

        const qa = validateResponse(text, req.reviewer_name, biz.hipaaMode || false);
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

    const variationScore = 1 - avgSimilarity;
    const finalQA = validateResponse(finalResponse, req.reviewer_name, biz.hipaaMode || false);
    const flags: ResponseFlag[] = [];
    if (!finalQA.passed) flags.push("quality_check_failed");
    if (avgSimilarity > 0.35) flags.push("high_similarity");
    if (biz.hipaaMode) flags.push("hipaa_check_needed");
    if (reviewRow.starRating <= 2) {
        flags.push("negative_review");
        flags.push("owner_review_required");
    }

    const confidenceScore = Math.max(0, 1 - (avgSimilarity * 0.5) - (generationCount * 0.1));
    if (confidenceScore < 0.5) flags.push("low_confidence");

    const status = reviewRow.starRating <= 2 ? "needs_review" : "draft";

    await db.insert(responses).values({
        reviewId: reviewId,
        businessId: biz.id,
        draftText: finalResponse,
        status: status,
        aiModel: "claude-3-5-sonnet-20241022",
        generationCount,
        similarityScore: avgSimilarity,
        variationScore,
        confidenceScore,
        flags,
        qaPassed: finalQA.passed,
    }).onConflictDoUpdate({
        target: responses.reviewId,
        set: {
            draftText: finalResponse,
            status: status,
            aiModel: "claude-3-5-sonnet-20241022",
            generationCount,
            similarityScore: avgSimilarity,
            variationScore,
            confidenceScore,
            flags,
            qaPassed: finalQA.passed,
            updatedAt: new Date(),
        }
    });

    await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId));

    if (subscription) {
        await db.update(subscriptions)
            .set({ responsesUsedThisMonth: subscription.responsesUsedThisMonth + 1 })
            .where(eq(subscriptions.userId, biz.userId));
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
