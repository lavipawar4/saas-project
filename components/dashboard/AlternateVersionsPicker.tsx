"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { saveResponseDraft } from "@/app/actions/reviews";

interface AlternateVersionsPickerProps {
    reviewId: string;
    alternates: string[];
    currentDraft: string;
}

export default function AlternateVersionsPicker({ reviewId, alternates, currentDraft }: AlternateVersionsPickerProps) {
    const [idx, setIdx] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [applied, setApplied] = useState(false);

    const current = alternates[idx];

    function copy() {
        navigator.clipboard.writeText(current);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    function applyVersion() {
        startTransition(async () => {
            await saveResponseDraft(reviewId, current);
            setApplied(true);
            setTimeout(() => setApplied(false), 2000);
        });
    }

    return (
        <div className="glass-card rounded-xl p-5 border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold">Alternate Versions</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {alternates.length} AI-generated alternative{alternates.length > 1 ? "s" : ""} — click Use This to swap it in
                    </p>
                </div>
                {/* Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground px-2">{idx + 1} / {alternates.length}</span>
                    <button
                        onClick={() => setIdx((i) => Math.min(alternates.length - 1, i + 1))}
                        disabled={idx === alternates.length - 1}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed mb-4 min-h-[80px]">
                {current}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={applyVersion}
                    disabled={isPending || applied || current === currentDraft}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all disabled:opacity-40"
                >
                    {applied ? <><Check className="w-3.5 h-3.5" /> Applied!</> : isPending ? "Applying…" : "Use This Version"}
                </button>
                <button
                    onClick={copy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
            </div>
        </div>
    );
}
