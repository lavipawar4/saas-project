/**
 * Computes Jaccard Similarity between two strings using bigrams (2-word pairs).
 */
export function jaccardSimilarity(text1: string, text2: string): number {
    const bigrams = (text: string) => {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const pairs = new Set<string>();
        for (let i = 0; i < words.length - 1; i++) {
            pairs.add(`${words[i]} ${words[i + 1]}`);
        }
        return pairs;
    };

    const set1 = bigrams(text1);
    const set2 = bigrams(text2);

    if (set1.size === 0 && set2.size === 0) return 0;

    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);

    return intersection.size / union.size;
}

/**
 * Validations to run on every generated response.
 */
export interface QAValidationResult {
    passed: boolean;
    errors: string[];
    fixedText: string;
    shouldRegenerate: boolean;
}

export function validateResponse(
    text: string,
    reviewerName: string,
    hipaaMode: boolean
): QAValidationResult {
    const errors: string[] = [];
    let fixedText = text;
    let shouldRegenerate = false;

    // 1. Name inclusion
    if (reviewerName && !text.toLowerCase().includes(reviewerName.toLowerCase())) {
        errors.push("Reviewer name missing from response");
        shouldRegenerate = true;
    }

    // 2. Length (50-180 words)
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    if (wordCount < 50 || wordCount > 180) {
        errors.push(`Word count (${wordCount}) is outside the 50-180 range`);
        shouldRegenerate = true;
    }

    // 3. Forbidden phrases & Post-process substitution
    const forbiddenMap: Record<string, string> = {
        "thank you for your review": "we appreciate your feedback",
        "fantastic": "excellent",
        "amazing experience": "great visit"
    };

    for (const [forbidden, replacement] of Object.entries(forbiddenMap)) {
        const regex = new RegExp(forbidden, "gi");
        if (regex.test(fixedText)) {
            fixedText = fixedText.replace(regex, replacement);
            errors.push(`Forbidden phrase "${forbidden}" substituted`);
        }
    }

    // 4. HIPAA mode
    const medicalTerms = [
        /\b(diagnosis|diagnose|diagnoses|diagnosed)\b/i,
        /\b(treatment|treat|treating|treated)\b/i,
        /\b(medical (condition|history|record))\b/i,
        /\b(prescription|medication|medicine)\b/i,
        /\b(symptom|disease|disorder|illness)\b/i,
        /\b(cure|cured|healing|healed)\b/i,
        /\b(patient|clinical|therapy)\b/i,
    ];

    if (hipaaMode) {
        for (const term of medicalTerms) {
            if (term.test(fixedText)) {
                errors.push(`HIPAA violation: medical term detected (${term.source})`);
                shouldRegenerate = true;
                break;
            }
        }
    }

    // 5. All caps (except abbreviations)
    // Heuristic: words > 3 chars that are ALL CAPS
    fixedText = fixedText.split(/\s+/).map(word => {
        if (word.length > 3 && word === word.toUpperCase() && !/^[A-Z]{2,4}$/.test(word)) {
            return word.toLowerCase();
        }
        return word;
    }).join(" ");

    // 6. Link injection
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    if (urlRegex.test(fixedText)) {
        fixedText = fixedText.replace(urlRegex, "");
        errors.push("URLs stripped from response");
    }

    // 7. Emoji overuse (Max 1)
    // Simplified emoji regex without 'u' flag
    const emojiRegex = /[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2011-\u26FF]/g;
    const emojis = fixedText.match(emojiRegex);
    if (emojis && emojis.length > 1) {
        // Keep only the first emoji
        let count = 0;
        fixedText = fixedText.replace(emojiRegex, (match) => {
            count++;
            return count === 1 ? match : "";
        });
        errors.push("Excess emojis removed");
    }

    return {
        passed: errors.length === 0,
        errors,
        fixedText: fixedText.trim(),
        shouldRegenerate
    };
}
