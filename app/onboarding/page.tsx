"use client";

import { useState, Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Star, Building2, Loader2, CheckCircle, ArrowRight,
    Link as LinkIcon, Palette, Zap, ChevronRight,
} from "lucide-react";
import { createBusiness, completeOnboarding } from "@/app/actions/auth";
import { generateResponse } from "@/app/actions/reviews";

// ─── Constants ───────────────────────────────
const INDUSTRIES = [
    "Restaurant", "Dental", "Salon & Beauty", "HVAC", "Plumbing",
    "Auto Repair", "Medical Spa", "Gym & Fitness", "Retail", "Hotel",
    "Healthcare", "Legal", "Real Estate", "Education", "Other",
];

const TONES = [
    {
        value: "professional",
        label: "Professional",
        desc: "Formal and business-appropriate",
        example: '"Thank you for your feedback. We appreciate your patronage and look forward to serving you."',
    },
    {
        value: "friendly",
        label: "Friendly",
        desc: "Warm and approachable",
        example: '"Hey Sarah! So glad you loved the experience — means the world to us. Hope to see you soon!"',
    },
    {
        value: "casual",
        label: "Casual",
        desc: "Relaxed and personable",
        example: '"Thanks so much! Really glad things went smoothly. Come back anytime 😊"',
    },
    {
        value: "empathetic",
        label: "Empathetic",
        desc: "Compassionate and understanding",
        example: '"We completely understand, and your experience genuinely matters to us. Thank you for sharing."',
    },
];

const SAMPLE_REVIEW = {
    id: "__sample__",
    reviewer_name: "Sarah M.",
    star_rating: 5,
    review_text: "Absolutely loved the experience from start to finish. The team was professional, friendly, and went above and beyond. Will definitely be coming back!",
};

// ─── Step indicator ───────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step > i + 1
                        ? "bg-green-500 text-white"
                        : step === i + 1
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-500/30"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                        {step > i + 1 ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`w-10 h-px transition-all ${step > i + 1 ? "bg-green-500/60" : "bg-border"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Main onboarding ──────────────────────────
function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const googleConnected = searchParams.get("connected") === "true";

    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    // Step 1 state
    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("Restaurant");
    const [ownerName, setOwnerName] = useState("");

    // Step 2 state
    const [tone, setTone] = useState("professional");
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");

    // Step 4 state
    const [demoResponse, setDemoResponse] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [demoGenerated, setDemoGenerated] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);

    function addKeyword(e: React.KeyboardEvent) {
        if (e.key === "Enter" && keywordInput.trim()) {
            e.preventDefault();
            if (keywords.length < 5) {
                setKeywords([...keywords, keywordInput.trim()]);
                setKeywordInput("");
            }
        }
    }
    function removeKeyword(kw: string) { setKeywords(keywords.filter(k => k !== kw)); }

    // Step 1 → 2
    function handleStep1(e: React.FormEvent) {
        e.preventDefault();
        if (!businessName.trim()) return;
        setStep(2);
    }

    // Step 2 → 3: save business
    async function handleStep2() {
        setError("");
        startTransition(async () => {
            const result = await createBusiness({ name: businessName, industry, tone, keywords, owner_name: ownerName });
            if (result.success) {
                setBusinessId(result.businessId ?? null);
                setStep(3);
            } else {
                setError(result.error || "Failed to save");
            }
        });
    }

    // Step 3 → 4
    function handleStep3Complete() { setStep(4); }

    // Step 4: generate demo
    async function handleGenerateDemo() {
        startTransition(async () => {
            setIsTyping(true);
            const fullText = `"${ownerName ? ownerName + " here" : "We"} are so glad to hear you had such a wonderful experience! ${businessName || "Our team"
                } works hard every day to make moments like yours possible. We can't wait to welcome you back soon!"`;

            // Artificial delay + character-by-character typing
            let current = "";
            const words = fullText.split(" ");
            for (const word of words) {
                current += word + " ";
                setDemoResponse(current.trim());
                await new Promise(r => setTimeout(r, 40 + Math.random() * 40));
            }

            setIsTyping(false);
            setDemoGenerated(true);
        });
    }

    // Finish
    async function handleFinish() {
        startTransition(async () => {
            await completeOnboarding();
            router.push("/dashboard");
        });
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/6 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-lg animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold gradient-text">ReviewAI</span>
                    </div>
                    <StepIndicator step={step} total={4} />
                </div>

                <div className="glass-card rounded-2xl p-8">

                    {/* ── STEP 1: Basic Info ── */}
                    {step === 1 && (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold">Basic Info</h2>
                                    <p className="text-xs text-muted-foreground">Tell us about your business</p>
                                </div>
                            </div>

                            <form onSubmit={handleStep1} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Business Name</label>
                                    <input
                                        type="text" value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        required placeholder="Tony's Italian Kitchen"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Industry</label>
                                    <select
                                        value={industry} onChange={e => setIndustry(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    >
                                        {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">
                                        Your First Name{" "}
                                        <span className="text-muted-foreground font-normal text-xs">(used in sign-offs)</span>
                                    </label>
                                    <input
                                        type="text" value={ownerName}
                                        onChange={e => setOwnerName(e.target.value)}
                                        placeholder="Tony"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>

                                <button type="submit"
                                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center justify-center gap-2">
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── STEP 2: Tone & Keywords ── */}
                    {step === 2 && (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold">Tone & Keywords</h2>
                                    <p className="text-xs text-muted-foreground">Customise how your AI sounds</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
                            )}

                            <div className="space-y-5">
                                {/* Tone cards */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Response Tone</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TONES.map(t => (
                                            <button key={t.value} type="button"
                                                onClick={() => setTone(t.value)}
                                                className={`p-3 rounded-lg border text-left transition-all ${tone === t.value
                                                    ? "border-indigo-500/60 bg-indigo-500/10"
                                                    : "border-border bg-secondary hover:border-indigo-500/30"
                                                    }`}>
                                                <div className="text-sm font-semibold">{t.label}</div>
                                                <div className="text-xs mt-0.5 text-muted-foreground">{t.desc}</div>
                                                {tone === t.value && (
                                                    <div className="mt-2 p-2 rounded bg-secondary/60 text-xs text-muted-foreground italic leading-relaxed">
                                                        {t.example}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Keywords */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">
                                        Brand Keywords{" "}
                                        <span className="text-muted-foreground font-normal text-xs">— add 2–5 phrases</span>
                                    </label>
                                    <input
                                        type="text" value={keywordInput}
                                        onChange={e => setKeywordInput(e.target.value)}
                                        onKeyDown={addKeyword}
                                        placeholder="e.g. family-owned, downtown Chicago… (Enter)"
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                    {keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {keywords.map(kw => (
                                                <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
                                                    {kw}
                                                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-indigo-200">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleStep2}
                                    disabled={isPending}
                                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isPending ? "Saving…" : <><span>Next</span><ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── STEP 3: Google Connect ── */}
                    {step === 3 && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                <LinkIcon className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold mb-1">Connect Google Business Profile</h2>
                            <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
                                Grant read + reply permissions so we can sync your reviews and publish responses.
                                We <strong>never post without your approval</strong>.
                            </p>

                            {/* Why it's needed */}
                            <div className="text-left mb-6 space-y-2">
                                {[
                                    "✅ Auto-sync new reviews as they arrive",
                                    "✅ Publish AI responses with one click",
                                    "✅ Track reply rates and response times",
                                ].map(item => (
                                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                                ))}
                            </div>

                            {googleConnected && (
                                <div className="mb-5 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                    <p className="text-green-400 text-sm font-medium">Google Business Profile connected!</p>
                                </div>
                            )}

                            <button
                                onClick={() => googleConnected ? handleStep3Complete() : (window.location.href = "/api/auth/google/connect")}
                                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center justify-center gap-2 mb-3"
                            >
                                {googleConnected
                                    ? <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
                                    : "Connect Google Business Profile"}
                            </button>
                            <button onClick={handleStep3Complete}
                                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Skip for now — I&apos;ll paste reviews manually →
                            </button>
                        </div>
                    )}

                    {/* ── STEP 4: Test Drive ── */}
                    {step === 4 && (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold">Test Drive 🚀</h2>
                                    <p className="text-xs text-muted-foreground">See the AI in action — before you pay</p>
                                </div>
                            </div>

                            {/* Sample review */}
                            <div className="glass-card rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className="w-3.5 h-3.5 text-green-400 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium">{SAMPLE_REVIEW.reviewer_name}</span>
                                    <span className="text-xs text-muted-foreground">· Sample review</span>
                                </div>
                                <p className="text-sm text-muted-foreground italic">{'"'}{SAMPLE_REVIEW.review_text}{'"'}</p>
                            </div>

                            {/* Generated response */}
                            {(demoGenerated || isTyping) ? (
                                <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        {isTyping ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                                        <span className={`text-sm font-medium ${isTyping ? "text-indigo-400" : "text-green-400"}`}>
                                            {isTyping ? "AI is thinking..." : "AI Response Generated"}
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-sm leading-relaxed relative overflow-hidden">
                                        {demoResponse}
                                        {isTyping && <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse" />}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateDemo}
                                    disabled={isPending}
                                    className="w-full py-3 mb-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                                    ) : (
                                        <><Zap className="w-4 h-4" /> Generate a Sample Response</>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleFinish}
                                disabled={isPending}
                                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {demoGenerated ? "Go to my dashboard →" : "Skip and go to dashboard →"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
