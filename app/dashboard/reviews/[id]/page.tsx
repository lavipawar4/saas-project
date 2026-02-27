import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: review } = await supabase
        .from("reviews")
        .select(`
          *,
          responses(*),
          businesses(name, tone, industry, keywords, user_id)
        `)
        .eq("id", id)
        .single();

    if (!review) notFound();

    const business = review.businesses as { user_id: string; name: string; tone: string; industry: string; keywords: string[] } | null;
    if (business?.user_id !== user.id) notFound();

    const response = review.responses as {
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

    const timeAgo = review.google_created_at
        ? new Date(review.google_created_at).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
        })
        : "Unknown date";

    const flags = response?.flags || [];
    const alternates = response?.alternate_versions || [];
    const isNegative = review.star_rating <= 2;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>

            {/* Owner review required banner */}
            {flags.includes("owner_review_required") && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/25">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-orange-300">Owner Review Required</p>
                        <p className="text-xs text-orange-400/80 mt-0.5">
                            This is a {review.star_rating}-star review. Please review the AI draft carefully before publishing.
                            Never auto-publish negative review responses.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-5 gap-6">
                {/* Left panel */}
                <div className="md:col-span-2 space-y-4">
                    {/* Review card */}
                    <div className="glass-card rounded-xl p-5">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            Customer Review
                        </h2>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-semibold">
                                {review.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{review.reviewer_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                </div>
                            </div>
                        </div>

                        <StarRating rating={review.star_rating} />

                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            {review.review_text || <em>No written review — rating only</em>}
                        </p>
                    </div>

                    {/* AI meta */}
                    {response && (
                        <div className="glass-card rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Details</h3>

                            {/* Confidence bar */}
                            {response.confidence_score !== null && (
                                <ConfidenceBar score={response.confidence_score} />
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Model</span>
                                    <span className="font-mono text-xs text-indigo-400">claude-sonnet-4-6</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Generations</span>
                                    <span>{response.generation_count}</span>
                                </div>
                                {response.variation_score !== null && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Variation</span>
                                        <span className={response.variation_score >= 0.65 ? "text-emerald-400" : "text-yellow-400"}>
                                            {Math.round(response.variation_score * 100)}%
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">QA</span>
                                    <span className={response.qa_passed ? "text-emerald-400 flex items-center gap-1" : "text-red-400"}>
                                        {response.qa_passed ? <><CheckCircle2 className="w-3 h-3" /> Passed</> : "✗ Failed"}
                                    </span>
                                </div>
                            </div>

                            {/* Flags */}
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

                            {/* Alternates count */}
                            {alternates.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {alternates.length} alternate version{alternates.length > 1 ? "s" : ""} available below
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: editor + alternates */}
                <div className="md:col-span-3 space-y-4">
                    <ResponseEditor
                        reviewId={review.id}
                        existingResponse={response}
                        reviewStatus={review.status}
                    />

                    {/* Alternate versions picker */}
                    {alternates.length > 0 && (
                        <AlternateVersionsPicker
                            reviewId={review.id}
                            alternates={alternates}
                            currentDraft={response?.draft_text || ""}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
