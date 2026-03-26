import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviews, businesses, responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ResponseEditor from "@/components/dashboard/ResponseEditor";
import AlternateVersionsPicker from "@/components/dashboard/AlternateVersionsPicker";
import { Star, ArrowLeft, Calendar, MessageSquare, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FLAG_META: Record<string, { label: string; color: string }> = {
    negative_review: { label: "Negative Review", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    owner_review_required: { label: "Owner Review Required", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    hipaa_check_needed: { label: "HIPAA Check Needed", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    low_confidence: { label: "Low Confidence", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    high_similarity: { label: "High Similarity", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-4 h-4 ${s <= rating ? "star-filled fill-current" : "star-empty"}`}
                />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
        </div>
    );
}

function ConfidenceBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-yellow-500" : "bg-red-500";
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <span className={`text-xs font-semibold ${pct >= 70 ? "text-emerald-400" : pct >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                    {pct}%
                </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5">
                <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default async function ReviewDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, id),
        with: {
            business: {
                columns: { name: true, tone: true, industry: true, keywords: true, userId: true }
            },
            responses: true
        }
    });

    if (!review) notFound();

    const business = review.business;
    if (business?.userId !== user.id) notFound();

    const responseList = review.responses;
    const response = responseList && responseList.length > 0 ? responseList[0] : null;

    const timeAgo = review.googleCreatedAt
        ? new Date(review.googleCreatedAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
        })
        : "Unknown date";

    const flags = (response?.flags as string[]) || [];
    const alternates = (response?.alternateVersions as string[]) || [];

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>

            {flags.includes("owner_review_required") && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/25">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-orange-300">Owner Review Required</p>
                        <p className="text-xs text-orange-400/80 mt-0.5">
                            This is a {review.starRating}-star review. Please review the AI draft carefully before publishing.
                            Never auto-publish negative review responses.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="glass-card rounded-xl p-5">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            Customer Review
                        </h2>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-semibold">
                                {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{review.reviewerName || "Anonymous"}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                </div>
                            </div>
                        </div>

                        <StarRating rating={review.starRating || 5} />

                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            {review.reviewText || <em>No written review — rating only</em>}
                        </p>
                    </div>

                    {response && (
                        <div className="glass-card rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Details</h3>

                            {response.confidenceScore !== null && (
                                <ConfidenceBar score={response.confidenceScore} />
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Model</span>
                                    <span className="font-mono text-xs text-indigo-400">claude-sonnet-4-6</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Generations</span>
                                    <span>{response.generationCount}</span>
                                </div>
                                {response.variationScore !== null && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Variation</span>
                                        <span className={response.variationScore >= 0.65 ? "text-emerald-400" : "text-yellow-400"}>
                                            {Math.round(response.variationScore * 100)}%
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">QA</span>
                                    <span className={response.qaPassed ? "text-emerald-400 flex items-center gap-1" : "text-red-400"}>
                                        {response.qaPassed ? <><CheckCircle2 className="w-3 h-3" /> Passed</> : "✗ Failed"}
                                    </span>
                                </div>
                            </div>

                            {flags.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" /> Flags
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {flags.map((flag) => {
                                            const meta = FLAG_META[flag] || { label: flag, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
                                            return (
                                                <span key={flag} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                                                    {meta.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {alternates.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {alternates.length} alternate version{alternates.length > 1 ? "s" : ""} available below
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 space-y-4">
                    <ResponseEditor
                        reviewId={review.id}
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
    );
}
