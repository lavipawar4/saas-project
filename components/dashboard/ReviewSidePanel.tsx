"use client";

import { useEffect, useCallback } from "react";
import { X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import ResponseEditor from "@/components/dashboard/ResponseEditor";
import AlternateVersionsPicker from "@/components/dashboard/AlternateVersionsPicker";
import type { ReviewWithResponse } from "@/lib/types/database";

interface ReviewSidePanelProps {
    review: ReviewWithResponse | null;
    isConnected: boolean;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
}

function StarRating({ rating }: { rating: number }) {
    const colors = [
        "text-red-400",
        "text-orange-400",
        "text-yellow-400",
        "text-lime-400",
        "text-green-400",
    ];
    const color = colors[Math.min(Math.max(rating - 1, 0), 4)];
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-4 h-4 ${s <= rating ? `${color} fill-current` : "text-muted-foreground/30"}`}
                />
            ))}
            <span className="ml-1 text-sm font-semibold text-foreground">{rating}.0</span>
        </div>
    );
}

export default function ReviewSidePanel({
    review,
    isConnected,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
}: ReviewSidePanelProps) {

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
        if (e.key === "ArrowRight" && hasNext && onNext) onNext();
    }, [onClose, onPrev, onNext, hasPrev, hasNext]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (review) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [review]);

    if (!review) return null;

    const responseList = review.responses as any;
    const response = responseList && responseList.length > 0 ? responseList[0] as {
        draftText: string;
        status: string;
        generationCount: number;
        similarityScore: number | null;
        confidenceScore: number | null;
        variationScore: number | null;
        flags: string[] | null;
        alternateVersions: string[] | null;
        qaPassed: boolean;
    } : null;

    const alternates = response?.alternateVersions || [];
    const reviewDate = review.googleCreatedAt
        ? new Date(review.googleCreatedAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
        })
        : "Unknown date";

    const reviewerName = review.reviewerName || "Anonymous";

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                onClick={onClose}
            />

            <div className="fixed right-0 top-0 h-full w-full max-w-5xl bg-background border-l border-border z-50 flex flex-col shadow-2xl animate-slide-in-right overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
                            title="Previous review (←)"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
                            title="Next review (→)"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground font-medium">
                            Review from {reviewDate}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="grid md:grid-cols-2 gap-0 h-full">
                        <div className="p-6 border-r border-border space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shrink-0 text-indigo-300 font-bold text-lg">
                                    {reviewerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{reviewerName}</p>
                                    <StarRating rating={review.starRating || 5} />
                                    <p className="text-xs text-muted-foreground mt-1">{reviewDate} · Google Review</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                {review.reviewText ? (
                                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                                        {review.reviewText}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        (No written review — rating only)
                                    </p>
                                )}
                            </div>

                            {response && (response.confidenceScore !== null || (response.flags?.length ?? 0) > 0) && (
                                <div className="space-y-3">
                                    {response.confidenceScore !== null && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-muted-foreground">AI Confidence</span>
                                                <span className="text-xs font-medium">
                                                    {Math.round((response.confidenceScore ?? 0) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-secondary rounded-full">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${(response.confidenceScore ?? 0) >= 0.7 ? "bg-green-500" :
                                                            (response.confidenceScore ?? 0) >= 0.45 ? "bg-yellow-500" : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${Math.round((response.confidenceScore ?? 0) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(response.flags?.length ?? 0) > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {response.flags?.map((flag) => {
                                                const flagStyles: Record<string, string> = {
                                                    hipaa_check_needed: "bg-red-500/10 border-red-500/25 text-red-400",
                                                    negative_review: "bg-orange-500/10 border-orange-500/25 text-orange-400",
                                                    owner_review_required: "bg-orange-500/10 border-orange-500/25 text-orange-400",
                                                    low_confidence: "bg-yellow-500/10 border-yellow-500/25 text-yellow-400",
                                                    high_similarity: "bg-blue-500/10 border-blue-500/25 text-blue-400",
                                                };
                                                return (
                                                    <span
                                                        key={flag}
                                                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${flagStyles[flag] ?? "bg-secondary border-border text-muted-foreground"}`}
                                                    >
                                                        {flag.replaceAll("_", " ")}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>

                        <div className="p-6 space-y-4">
                            <ResponseEditor
                                reviewId={review.id}
                                isConnected={isConnected}
                                existingResponse={response as any}
                                reviewStatus={review.status || "unanswered"}
                            />

                            {alternates.length > 0 && (
                                <AlternateVersionsPicker
                                    reviewId={review.id}
                                    alternates={alternates}
                                    currentDraft={response?.draftText || ""}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
