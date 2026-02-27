import { jaccardSimilarity, validateResponse } from "../lib/ai/validator";

console.log("--- Testing Jaccard Similarity ---");
const t1 = "Hello world this is a test";
const t2 = "Hello world this is another test";
const t3 = "Completely different text here";

console.log(`Similarity (t1, t2): ${jaccardSimilarity(t1, t2).toFixed(4)} (Expected: ~0.4-0.6)`);
console.log(`Similarity (t1, t3): ${jaccardSimilarity(t1, t3).toFixed(4)} (Expected: 0)`);

console.log("\n--- Testing QA Validation ---");
const reviewer = "John Doe";

// Test 1: Perfect response
const resp1 = "Hello John Doe, we really appreciate your feedback about our pizza. Our team works hard to ensure every visit is an excellent once. We hope to see you again soon at Luigi's Pizza! Regards, the team.";
const res1 = validateResponse(resp1, reviewer, false);
console.log("Test 1 (Perfect):", res1.passed ? "PASSED" : "FAILED", res1.errors);

// Test 2: Forbidden phrases and caps
const resp2 = "FANTASTIC AMAZING EXPERIENCE THANK YOU FOR YOUR REVIEW. THIS IS A TEST.";
const res2 = validateResponse(resp2, reviewer, false);
console.log("Test 2 (Forbidden/Caps):", res2.errors);
console.log("Fixed Text:", res2.fixedText);

// Test 3: HIPAA Mode
const resp3 = "Hi John Doe, we reviewed your diagnosis and treatment plan.";
const res3 = validateResponse(resp3, reviewer, true);
console.log("Test 3 (HIPAA):", res3.passed ? "PASSED" : "FAILED", res3.errors);

// Test 4: Emojis and Links
const resp4 = "Hello John, visit us at https://pizza.com 🍕🍕🍕";
const res4 = validateResponse(resp4, reviewer, false);
console.log("Test 4 (Links/Emojis):", res4.errors);
console.log("Fixed Text:", res4.fixedText);
