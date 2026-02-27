"use client";

import { useState, useTransition } from "react";
import { Zap, Send, Loader2, CheckCircle, RotateCcw, Copy, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { generateResponse, saveResponseDraft, publishResponse, skipReview } from "@/app/actions/reviews";
import { useRouter } from "next/navigation";

interface ResponseEditorProps {
    reviewId: string;
    isConnected?: boolean;
    existingResponse: {
        draft_text: string;
        status: string;
        generation_count: number;
        similarity_score: number | null;
        confidence_score: number | null;
        variation_score: number | null;
        flags: string[] | null;
        alternate_versions: string[] | null;
        qa_passed: boolean;
    } | null;
    reviewStatus: string;
}

const CHAR_MIN = 100;
const CHAR_MAX = 500; // Google recommended display range
const WORD_TARGET_MIN = 30;
const WORD_TARGET_MAX = 180;

export default function ResponseEditor({
    reviewId,
    isConnected = false,
    existingResponse,
    reviewStatus,
}: ResponseEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [text, setText] = useState(existingResponse?.draft_text || "");
    const [isEditing, setIsEditing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [action, setAction] = useState<"generate" | "save" | "publish" | "skip" | null>(null);
    const [copied, setCopied] = useState(false);
    const [variationScore, setVariationScore] = useState<number | null>(existingResponse?.variation_score ?? null);
    const [flags, setFlags] = useState<string[]>(existingResponse?.flags ?? []);

    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const isPublished = reviewStatus === "published" || reviewStatus === "auto_published";

    // Derived warnings
    const showSimilarityWarning = variationScore !== null && variationScore < 0.55;
    const showHipaaWarning = flags.includes("hipaa_check_needed");

    // Char count colour
    const charColor = charCount === 0 ? "" : charCount < CHAR_MIN || charCount > CHAR_MAX ? "text-yellow-400" : "text-green-400";
    const charBarColor = charCount < CHAR_MIN || charCount > CHAR_MAX ? "bg-yellow-500" : "bg-green-500";

    function showFeedback(type: "success" | "error", message: string) {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    }

    async function handleGenerate() {
        setAction("generate");
        startTransition(async () => {
            const result = await generateResponse(reviewId);
            if (result.success && result.text) {
                setText(result.text);
                setIsEditing(false);
                if (result.variation_score !== undefined) setVariationScore(result.variation_score ?? null);
                if (result.flags) setFlags(result.flags as string[]);
                showFeedback("success", `Generated (${result.generationCount} attempt${result.generationCount !== 1 ? "s" : ""})`);
            } else {
                showFeedback("error", result.error || "Generation failed");
            }
            setAction(null);
        });
    }

    async function handleSave() {
        setAction("save");
        startTransition(async () => {
            const result = await saveResponseDraft(reviewId, text);
            if (result.success) {
                setIsEditing(false);
                showFeedback("success", "Draft saved");
            } else {
                showFeedback("error", result.error || "Save failed");
            }
            setAction(null);
        });
    }

    async function handlePublish() {
        if (!text.trim()) { showFeedback("error", "Generate or write a response first"); return; }
        if (!isConnected) { showFeedback("error", "Connect Google Business Profile first"); return; }
        setAction("publish");
        startTransition(async () => {
            const result = await publishResponse(reviewId, text);
            if (result.success) {
                showFeedback("success", "Published to Google Business Profile!");
                router.refresh();
            } else {
                showFeedback("error", result.error || "Publish failed");
            }
            setAction(null);
        });
    }

    async function handleSkip() {
        setAction("skip");
        startTransition(async () => {
            await skipReview(reviewId);
            router.push("/dashboard");
        });
    }

    async function handleCopy() {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="glass-card rounded-xl p-6 h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    AI Response
                    {isPublished && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-published text-xs">
                            <CheckCircle className="w-3 h-3" /> Published
                        </span>
                    )}
                </h2>

                {/* Copy button — always available */}
                {text && (
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-indigo-500/30 transition-all"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? "Copied!" : "Copy"}
                    </button>
                )}
            </div>

            {/* Warnings */}
            {showSimilarityWarning && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/8 border border-blue-500/20">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-400">
                        <span className="font-semibold">Too similar to a recent response.</span>{" "}
                        Consider regenerating or editing for more variety.
                    </p>
                </div>
            )}

            {showHipaaWarning && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">
                        <span className="font-semibold">HIPAA flag detected.</span>{" "}
                        Review this response carefully — it may reference specific treatments or conditions.
                    </p>
                </div>
            )}

            {/* Feedback banner */}
            {feedback && (
                <div className={`p-3 rounded-lg text-sm border ${feedback.type === "success"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                    }`}>
                    {feedback.message}
                </div>
            )}

            {/* Textarea */}
            <div className="relative flex-1">
                <textarea
                    value={text}
                    onChange={(e) => { setText(e.target.value); setIsEditing(true); }}
                    placeholder={isPublished ? "" : "Generate an AI response or write your own…"}
                    rows={8}
                    disabled={isPublished}
                    className="w-full h-full min-h-[12rem] px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none text-sm leading-relaxed disabled:opacity-60"
                />
            </div>

            {/* Counters — char + word */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                    <span className={charColor || "text-muted-foreground"}>
                        {charCount} chars {charCount < CHAR_MIN ? <span className="opacity-70">(aim ≥{CHAR_MIN})</span>
                            : charCount > CHAR_MAX ? <span className="opacity-70">(aim ≤{CHAR_MAX})</span> : null}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-muted-foreground">
                        {wordCount} words
                        {wordCount > 0 && (wordCount < WORD_TARGET_MIN || wordCount > WORD_TARGET_MAX) && (
                            <span className="text-yellow-400 ml-1">(aim {WORD_TARGET_MIN}–{WORD_TARGET_MAX})</span>
                        )}
                    </span>
                </div>
                {charCount > 0 && (
                    <div className="w-20 bg-secondary rounded-full h-1">
                        <div
                            className={`h-1 rounded-full transition-all ${charBarColor}`}
                            style={{ width: `${Math.min(100, (charCount / CHAR_MAX) * 100)}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isPublished && (
                <div className="space-y-2">
                    {/* Generate / Regenerate */}
                    <button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all"
                    >
                        {action === "generate" && isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                        ) : (
                            <><Zap className="w-4 h-4" />{text ? "Regenerate" : "Generate Response"}</>
                        )}
                    </button>

                    {/* Save draft */}
                    {isEditing && text && (
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg glass-card border border-border hover:border-indigo-500/30 text-sm font-medium transition-all"
                        >
                            {action === "save" && isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            ) : (
                                <><RotateCcw className="w-4 h-4" /> Save draft</>
                            )}
                        </button>
                    )}

                    {/* Publish to Google */}
                    {text && (
                        <div className="relative group">
                            <button
                                onClick={handlePublish}
                                disabled={isPending || !isConnected}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
                            >
                                {action === "publish" && isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Publish to Google</>
                                )}
                            </button>
                            {/* Tooltip when not connected */}
                            {!isConnected && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-popover border border-border text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                    <AlertTriangle className="w-3 h-3 inline-block mr-1 text-yellow-400" />
                                    Connect Google Business Profile first
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skip */}
                    <button
                        onClick={handleSkip}
                        disabled={isPending}
                        className="w-full py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Skip this review →
                    </button>
                </div>
            )}

            {isPublished && (
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-400 font-medium">Response published to Google Business Profile</p>
                </div>
            )}
        </div>
    );
}
