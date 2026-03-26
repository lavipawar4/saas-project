"use client";

import { useState } from "react";
import { RefreshCw, Star, Clock, CheckCircle, SkipForward, Plus, Zap } from "lucide-react";
import Link from "next/link";
import InboxFilters from "@/components/dashboard/InboxFilters";
import ReviewSidePanel from "@/components/dashboard/ReviewSidePanel";
import BatchQueue from "@/components/dashboard/BatchQueue";
import type { ReviewWithResponse } from "@/lib/types/database";

interface DashboardClientProps {
    reviews: ReviewWithResponse[];
    business: {
        id: string;
        name: string;
        isConnected: boolean;
        lastSyncedAt: Date | null;
    } | null;
}

export default function DashboardClient({ reviews, business }: DashboardClientProps) {
    const [selectedReview, setSelectedReview] = useState<ReviewWithResponse | null>(null);

    const stats = {
        total: reviews.length,
        unanswered: reviews.filter(r => r.status === "pending" || r.status === "unanswered").length,
        published: reviews.filter(r => r.status === "published" || r.status === "auto_published").length,
        drafts: reviews.filter(r => r.status === "draft" || r.status === "needs_review").length,
    };

    const lastSynced = business?.lastSyncedAt
        ? new Date(business.lastSyncedAt).toLocaleString()
        : "Never";

    const selectedIdx = selectedReview ? reviews.findIndex(r => r.id === selectedReview.id) : -1;
    const hasPrev = selectedIdx > 0;
    const hasNext = selectedIdx < reviews.length - 1;

    return (
        <>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 text-left">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Review Inbox</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {business?.name || "Your Business"} · Last synced: {lastSynced}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <BatchQueue
                            pendingReviews={reviews.filter(r => r.status === "pending" || r.status === "unanswered")}
                            businessId={business?.id || ""}
                        />
                        <Link
                            href="/dashboard?sync=1"
                            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg glass-card border border-border hover:border-indigo-500/30 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sync
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    {[
                        { label: "Total Reviews", value: stats.total, icon: Star, color: "text-indigo-400" },
                        { label: "Unanswered", value: stats.unanswered, icon: Clock, color: "text-yellow-400" },
                        { label: "Published", value: stats.published, icon: CheckCircle, color: "text-green-400" },
                        { label: "Drafts", value: stats.drafts, icon: Zap, color: "text-blue-400" },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="glass-card rounded-xl p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                    <span className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</span>
                                </div>
                                <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {!business?.isConnected && (
                    <div className="glass-card rounded-xl p-4 md:p-6 mb-6 border border-indigo-500/20 bg-indigo-500/5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                    <Plus className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm md:text-base">Connect Google Business Profile</p>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                        Sync and publish reviews automatically.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/settings"
                                className="w-full md:w-auto md:ml-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors text-center"
                            >
                                Connect
                            </Link>
                        </div>
                    </div>
                )}

                {reviews.length === 0 ? (
                    <div className="glass-card rounded-xl p-16 text-center">
                        <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground">No reviews yet. Sync your Google Business Profile to get started.</p>
                    </div>
                ) : (
                    <InboxFilters
                        reviews={reviews}
                        onSelectReview={setSelectedReview}
                    />
                )}
            </div>

            <ReviewSidePanel
                review={selectedReview}
                isConnected={business?.isConnected ?? false}
                onClose={() => setSelectedReview(null)}
                onPrev={() => selectedIdx > 0 && setSelectedReview(reviews[selectedIdx - 1])}
                onNext={() => selectedIdx < reviews.length - 1 && setSelectedReview(reviews[selectedIdx + 1])}
                hasPrev={hasPrev}
                hasNext={hasNext}
            />
        </>
    );
}
