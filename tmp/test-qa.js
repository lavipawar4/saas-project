function jaccardSimilarity(text1, text2) {
    const bigrams = (text) => {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const pairs = new Set();
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

function validateResponse(text, reviewerName, hipaaMode) {
    const errors = [];
    let fixedText = text;
    let shouldRegenerate = false;

    if (reviewerName && !text.toLowerCase().includes(reviewerName.toLowerCase())) {
        errors.push("Reviewer name missing from response");
        shouldRegenerate = true;
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    if (wordCount < 10 || wordCount > 250) { // Using expanded range for test
        errors.push(`Word count (${wordCount}) outside range`);
        shouldRegenerate = true;
    }

    const forbiddenMap = {
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

    if (hipaaMode && /\b(diagnosis|treatment|patient|medical)\b/i.test(fixedText)) {
        errors.push("HIPAA violation detected");
        shouldRegenerate = true;
    }

    // Simplified all caps fix
    fixedText = fixedText.split(/\s+/).map(word => {
        if (word.length > 3 && word === word.toUpperCase()) return word.toLowerCase();
        return word;
    }).join(" ");

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    if (urlRegex.test(fixedText)) {
        fixedText = fixedText.replace(urlRegex, "");
        errors.push("URLs stripped");
    }

    const emojiRegex = /[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/g;
    const emojis = fixedText.match(emojiRegex);
    if (emojis && emojis.length > 1) {
        let count = 0;
        fixedText = fixedText.replace(emojiRegex, (match) => {
            count++; return count === 1 ? match : "";
        });
        errors.push("Emojis cleaned");
    }

    return { passed: errors.length === 0, errors, fixedText: fixedText.trim(), shouldRegenerate };
}

console.log("--- Jaccard Test ---");
const t1 = "Hello world this is a test";
const t2 = "Hello world this is another test";
console.log(`Similarity: ${jaccardSimilarity(t1, t2).toFixed(4)}`);

console.log("\n--- QA Test ---");
const res = validateResponse("FANTASTIC AMAZING EXPERIENCE THANK YOU FOR YOUR REVIEW. visit https://test.com 🍕🍕🍕", "John", false);
console.log("Passed:", res.passed);
console.log("Errors:", res.errors);
console.log("Fixed:", res.fixedText);
