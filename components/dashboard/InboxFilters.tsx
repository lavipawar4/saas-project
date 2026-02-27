"use client";

import { useState, useMemo } from "react";
import { Filter, Calendar, X } from "lucide-react";
import ReviewCard from "@/components/dashboard/ReviewCard";
import type { ReviewWithResponse } from "@/lib/types/database";

type FilterTab = "all" | "unanswered" | "drafts" | "published";

interface InboxFiltersProps {
    reviews: ReviewWithResponse[];
    onSelectReview: (review: ReviewWithResponse) => void;
}

const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unanswered", label: "Unanswered" },
    { key: "drafts", label: "Drafts" },
    { key: "published", label: "Published" },
];

const UNANSWERED_STATUSES = ["pending", "unanswered"];
const DRAFT_STATUSES = ["draft", "needs_review", "editing"];

export default function InboxFilters({ reviews, onSelectReview }: InboxFiltersProps) {
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const counts: Record<FilterTab, number> = useMemo(() => ({
        all: reviews.length,
        unanswered: reviews.filter(r => UNANSWERED_STATUSES.includes(r.status)).length,
        drafts: reviews.filter(r => DRAFT_STATUSES.includes(r.status)).length,
        published: reviews.filter(r => r.status === "published" || r.status === "auto_published").length,
    }), [reviews]);

    const filtered = useMemo(() => {
        let list = reviews;

        // Tab filter
        if (activeTab === "unanswered") list = list.filter(r => UNANSWERED_STATUSES.includes(r.status));
        else if (activeTab === "drafts") list = list.filter(r => DRAFT_STATUSES.includes(r.status));
        else if (activeTab === "published") list = list.filter(r => r.status === "published" || r.status === "auto_published");

        // Date range filter
        if (dateFrom) {
            const from = new Date(dateFrom).getTime();
            list = list.filter(r => r.google_created_at && new Date(r.google_created_at).getTime() >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime() + 86_400_000; // inclusive end
            list = list.filter(r => r.google_created_at && new Date(r.google_created_at).getTime() <= to);
        }

        return list;
    }, [reviews, activeTab, dateFrom, dateTo]);

    const hasDateFilter = dateFrom || dateTo;

    function clearDates() {
        setDateFrom("");
        setDateTo("");
    }

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                {/* Tab strip */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                                    ? "bg-white/20 text-white"
                                    : "bg-border text-muted-foreground"
                                }`}>
                                {counts[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2 ml-auto">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        title="From date"
                    />
                    <span className="text-muted-foreground text-xs">—</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        title="To date"
                    />
                    {hasDateFilter && (
                        <button
                            onClick={clearDates}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Clear date filter"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="glass-card rounded-xl p-16 text-center">
                    <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">No reviews match these filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(review => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onClick={() => onSelectReview(review)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
