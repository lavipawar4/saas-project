"use client";

import { Star, Clock, CheckCircle, SkipForward, AlertTriangle, Zap, Edit3 } from "lucide-react";
import type { ReviewWithResponse, ReviewStatus } from "@/lib/types/database";

interface ReviewCardProps {
    review: ReviewWithResponse;
    onClick: () => void;
}

function StarRating({ rating }: { rating: number }) {
    const colors = ["text-red-400", "text-orange-400", "text-yellow-400", "text-lime-400", "text-green-400"];
    const color = colors[Math.min(Math.max(rating - 1, 0), 4)];
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? `${color} fill-current` : "text-muted-foreground/30"}`} />
            ))}
        </div>
    );
}

const statusConfig: Record<ReviewStatus, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: "Unanswered", className: "badge-pending", icon: Clock },
    unanswered: { label: "Unanswered", className: "badge-pending", icon: Clock },
    draft: { label: "Draft Ready", className: "badge-draft", icon: Edit3 },
    needs_review: { label: "Needs Review", className: "badge-pending", icon: AlertTriangle },
    published: { label: "Published", className: "badge-published", icon: CheckCircle },
    auto_published: { label: "Auto-Published", className: "badge-published", icon: CheckCircle },
    skipped: { label: "Skipped", className: "badge-skipped", icon: SkipForward },
};

function ActionChip({ status }: { status: ReviewStatus }) {
    if (status === "published" || status === "auto_published" || status === "skipped") return null;
    const isDraft = status === "draft" || status === "needs_review";
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${isDraft
            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
            : "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
            }`}>
            {isDraft ? <Edit3 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {isDraft ? "Edit Draft" : "Generate Response"}
        </span>
    );
}

export default function ReviewCard({ review, onClick }: ReviewCardProps) {
    const config = statusConfig[review.status] ?? statusConfig.pending;
    const Icon = config.icon;

    const snippet = review.review_text
        ? review.review_text.length > 80
            ? review.review_text.slice(0, 80).trim() + "…"
            : review.review_text
        : null;

    const timeAgo = review.google_created_at
        ? new Date(review.google_created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
        })
        : "Unknown date";

    return (
        <button
            onClick={onClick}
            className="w-full text-left glass-card rounded-xl p-5 hover:border-indigo-500/25 border border-transparent transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shrink-0 text-indigo-300 font-semibold text-sm mt-0.5">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Row 1: name + stars + date + status badge */}
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{review.reviewer_name}</span>
                        <StarRating rating={review.star_rating} />
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                        </span>
                    </div>

                    {/* Row 2: snippet (80 chars) */}
                    <p className="text-sm text-muted-foreground">
                        {snippet ?? <em className="not-italic opacity-60">No written review</em>}
                    </p>
                </div>

                {/* Action chip — right side */}
                <div className="shrink-0 self-center">
                    <ActionChip status={review.status} />
                </div>
            </div>
        </button>
    );
}
