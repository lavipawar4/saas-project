"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, ChevronLeft, ChevronRight, Check, SkipForward, Send, Loader2, AlertCircle } from "lucide-react";
import type { ReviewWithResponse } from "@/lib/types/database";
import { publishResponse, skipReview } from "@/app/actions/reviews";

interface BatchQueueProps {
    pendingReviews: ReviewWithResponse[];
    businessId: string;
}

interface DraftResult {
    reviewId: string;
    reviewerName: string;
    starRating: number;
    reviewText: string | null;
    draftText: string;
    edited: string;
    status: "pending" | "approved" | "skipped";
}

type BatchPhase = "idle" | "generating" | "reviewing" | "publishing" | "done";

export default function BatchQueue({ pendingReviews, businessId }: BatchQueueProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<BatchPhase>("idle");
    const [progress, setProgress] = useState(0);
    const [drafts, setDrafts] = useState<DraftResult[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [publishCount, setPublishCount] = useState(0);

    const pendingCount = pendingReviews.length;

    const startBatch = async () => {
        if (pendingCount === 0) return;
        setPhase("generating");
        setError(null);
        setProgress(0);
        setDrafts([]);
        setCurrentIdx(0);

        try {
            const res = await fetch("/api/reviews/batch-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Generation failed");
            }

            const { results } = await res.json();

            // Fetch the generated drafts from Supabase via re-fetch
            // We'll read the data back from the page response
            const draftItems: DraftResult[] = [];
            for (const pending of pendingReviews) {
                const result = results.find((r: { reviewId: string }) => r.reviewId === pending.id);
                if (result?.success === false) continue;

                // Refetch the response for this review
                const resp = await fetch(`/api/reviews/${pending.id}/draft`);
                if (!resp.ok) continue;
                const { draft_text } = await resp.json();

                draftItems.push({
                    reviewId: pending.id,
                    reviewerName: pending.reviewer_name,
                    starRating: pending.star_rating,
                    reviewText: pending.review_text,
                    draftText: draft_text,
                    edited: draft_text,
                    status: "pending",
                });
                setProgress(Math.round((draftItems.length / pendingCount) * 100));
            }

            setDrafts(draftItems);
            setPhase("reviewing");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setPhase("idle");
        }
    };

    const approveCurrent = () => {
        setDrafts((prev) => prev.map((d, i) => i === currentIdx ? { ...d, status: "approved" } : d));
        if (currentIdx < drafts.length - 1) setCurrentIdx((i) => i + 1);
    };

    const skipCurrent = () => {
        setDrafts((prev) => prev.map((d, i) => i === currentIdx ? { ...d, status: "skipped" } : d));
        if (currentIdx < drafts.length - 1) setCurrentIdx((i) => i + 1);
    };

    const updateCurrentEdit = (text: string) => {
        setDrafts((prev) => prev.map((d, i) => i === currentIdx ? { ...d, edited: text } : d));
    };

    const publishAll = async () => {
        const approved = drafts.filter((d) => d.status === "approved");
        if (approved.length === 0) return;
        setPhase("publishing");
        let count = 0;

        for (const draft of approved) {
            await publishResponse(draft.reviewId, draft.edited);
            count++;
        }

        // Skip the ones marked skipped
        for (const draft of drafts.filter((d) => d.status === "skipped")) {
            await skipReview(draft.reviewId);
        }

        setPublishCount(count);
        setPhase("done");
    };

    const approvedCount = drafts.filter((d) => d.status === "approved").length;
    const skippedCount = drafts.filter((d) => d.status === "skipped").length;
    const pendingDecisionCount = drafts.filter((d) => d.status === "pending").length;
    const current = drafts[currentIdx];

    const StarBadge = ({ rating }: { rating: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-xs ${s <= rating ? "text-yellow-400" : "text-white/10"}`}>★</span>
            ))}
        </div>
    );

    // IDLE: Button to launch batch
    if (phase === "idle") {
        return (
            <button
                onClick={startBatch}
                disabled={pendingCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.02]"
            >
                <Sparkles className="w-4 h-4" />
                Generate All{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
        );
    }

    // GENERATING
    if (phase === "generating") {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Generating responses…</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Claude AI is writing {pendingCount} responses
                    </p>
                    <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </div>
            </div>
        );
    }

    // DONE
    if (phase === "done") {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="glass-card rounded-2xl p-8 max-w-sm w-full border border-emerald-500/20 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Batch complete!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                        <span className="text-emerald-400 font-semibold">{publishCount} responses</span> published to Google.
                    </p>
                    <button
                        onClick={() => { setPhase("idle"); router.refresh(); }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // PUBLISHING
    if (phase === "publishing") {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 text-center">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Publishing to Google…</h3>
                    <p className="text-sm text-muted-foreground">Posting {approvedCount} approved responses</p>
                </div>
            </div>
        );
    }

    // REVIEWING phase — slide-over drawer
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col glass-card border border-white/10 rounded-t-2xl md:rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="font-semibold">Review Batch Queue</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {currentIdx + 1} of {drafts.length} · {approvedCount} approved · {skippedCount} skipped · {pendingDecisionCount} remaining
                        </p>
                    </div>
                    <button
                        onClick={() => { setPhase("idle"); }}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/5">
                    <div
                        className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                        style={{ width: `${((currentIdx + 1) / drafts.length) * 100}%` }}
                    />
                </div>

                {/* Error if any */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Review + Draft content */}
                {current && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Review */}
                        <div className="rounded-xl p-4 bg-white/[0.03] border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                                    {current.reviewerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{current.reviewerName}</p>
                                    <StarBadge rating={current.starRating} />
                                </div>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${current.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : current.status === "skipped" ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    }`}>
                                    {current.status === "approved" ? "Approved" : current.status === "skipped" ? "Skipped" : "Pending"}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {current.reviewText || <em>No written review</em>}
                            </p>
                        </div>

                        {/* AI Draft — editable */}
                        <div>
                            <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 block">
                                AI Draft Response
                            </label>
                            <textarea
                                value={current.edited}
                                onChange={(e) => updateCurrentEdit(e.target.value)}
                                rows={5}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-indigo-500/40 transition-colors text-foreground leading-relaxed"
                                placeholder="AI response will appear here..."
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                                {current.edited.length} chars
                            </p>
                        </div>
                    </div>
                )}

                {/* Action row */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
                    {/* Previous */}
                    <button
                        onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                        disabled={currentIdx === 0}
                        className="p-2 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Skip */}
                    <button
                        onClick={skipCurrent}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip
                    </button>

                    {/* Approve */}
                    <button
                        onClick={approveCurrent}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                    </button>

                    {/* Next */}
                    <button
                        onClick={() => setCurrentIdx((i) => Math.min(drafts.length - 1, i + 1))}
                        disabled={currentIdx === drafts.length - 1}
                        className="p-2 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Publish all approved */}
                    <button
                        onClick={publishAll}
                        disabled={approvedCount === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Publish {approvedCount > 0 ? `(${approvedCount})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}
