"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Zap, ShieldCheck, AlignLeft } from "lucide-react";
import { updateBusinessSettings } from "@/app/actions/auth";
import type { Business } from "@/lib/types/database";
import { INDUSTRY_PRESETS } from "@/lib/ai/presets";

const INDUSTRIES = [
    "Restaurant", "Dental", "HVAC", "Salon", "Retail", "Healthcare", "Legal",
    "Real Estate", "Hotel", "Spa & Beauty", "Automotive", "Gym & Fitness",
    "E-commerce", "Consulting", "Technology", "Education", "Other",
];

const TONES = [
    { value: "professional", label: "Professional", description: "Structured, formal, and authoritative." },
    { value: "friendly", label: "Friendly", description: "Conversational and welcoming." },
    { value: "casual", label: "Casual", description: "Relaxed and relatable." },
    { value: "warm", label: "Warm", description: "Expressive and community-focused." },
];

const RESPONSE_LENGTHS = [
    { value: "short", label: "Short", description: "1-2 sentences — concise & quick" },
    { value: "medium", label: "Medium", description: "3-4 sentences — balanced (recommended)" },
    { value: "long", label: "Long", description: "5+ sentences — detailed & thorough" },
];

export default function SettingsForm({ business }: { business: Business }) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(business.name);
    const [industry, setIndustry] = useState(business.industry);
    const [locationCity, setLocationCity] = useState(business.location_city || "");
    const [tone, setTone] = useState<string>(business.tone);
    const [keywords, setKeywords] = useState<string[]>(business.keywords || []);
    const [keywordInput, setKeywordInput] = useState("");
    const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">(
        business.response_length || "medium"
    );
    const [autoRespond, setAutoRespond] = useState(business.auto_respond || false);
    const [hipaaMode, setHipaaMode] = useState(business.hipaa_mode || false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    function handleIndustryChange(newIndustry: string) {
        setIndustry(newIndustry);
        const preset = INDUSTRY_PRESETS[newIndustry];
        if (preset && (keywords.length === 0 || window.confirm("Add suggested keywords for this industry?"))) {
            // Merge unique keywords
            const merged = Array.from(new Set([...keywords, ...preset.keywords]));
            setKeywords(merged);
        }
    }

    function addKeyword(e: React.KeyboardEvent) {
        if (e.key === "Enter" && keywordInput.trim()) {
            e.preventDefault();
            if (keywords.length < 15 && !keywords.includes(keywordInput.trim())) {
                setKeywords([...keywords, keywordInput.trim()]);
                setKeywordInput("");
            }
        }
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const result = await updateBusinessSettings(business.id, {
                name, industry, tone, keywords,
                location_city: locationCity,
                response_length: responseLength,
                auto_respond: autoRespond,
                hipaa_mode: hipaaMode,
            });
            setFeedback({
                type: result.success ? "success" : "error",
                message: result.success ? "Settings saved!" : result.error || "Save failed",
            });
            setTimeout(() => setFeedback(null), 3000);
        });
    }

    return (
        <div className="space-y-5">
            {/* Business Profile Card */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="font-semibold mb-4">Business Profile</h2>

                {feedback && (
                    <div className={`mb-4 p-3 rounded-lg text-sm border ${feedback.type === "success"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}>
                        {feedback.message}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Business Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Industry</label>
                            <select
                                value={industry}
                                onChange={(e) => handleIndustryChange(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                            >
                                {INDUSTRIES.map((ind) => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">City / Location <span className="text-muted-foreground font-normal text-xs">(for local SEO)</span></label>
                            <input
                                type="text"
                                value={locationCity}
                                onChange={(e) => setLocationCity(e.target.value)}
                                placeholder="e.g. Chicago"
                                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Response Tone</label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                        >
                            {TONES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Brand Keywords <span className="text-muted-foreground font-normal text-xs">(press Enter to add)</span>
                        </label>
                        <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={addKeyword}
                            placeholder="Type a keyword..."
                            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                        />
                        {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {keywords.map((kw: string) => (
                                    <span
                                        key={kw}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs"
                                    >
                                        {kw}
                                        <button type="button" onClick={() => setKeywords(keywords.filter((k: string) => k !== kw))}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                    >
                        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save changes</>}
                    </button>
                </form>
            </div>

            {/* AI Preferences Card */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="font-semibold mb-1">AI Response Preferences</h2>
                <p className="text-xs text-muted-foreground mb-5">Controls how Claude generates responses for your reviews.</p>

                <div className="space-y-6">
                    {/* Response Length */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-3">
                            <AlignLeft className="w-4 h-4 text-indigo-400" />
                            Response Length
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {RESPONSE_LENGTHS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setResponseLength(opt.value as "short" | "medium" | "long")}
                                    className={`relative p-3 rounded-xl border text-left transition-all ${responseLength === opt.value
                                        ? "border-indigo-500/60 bg-indigo-500/10"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                        }`}
                                >
                                    <span className={`block text-sm font-semibold mb-1 ${responseLength === opt.value ? "text-indigo-300" : "text-foreground"}`}>
                                        {opt.label}
                                    </span>
                                    <span className="block text-xs text-muted-foreground leading-snug">{opt.description}</span>
                                    {responseLength === opt.value && (
                                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Auto-respond toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <Zap className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Auto-Respond <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">Pro</span></p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xs">
                                    Automatically publish high-confidence AI responses to Google without manual review.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={autoRespond}
                            onClick={() => setAutoRespond(!autoRespond)}
                            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${autoRespond ? "bg-indigo-600" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoRespond ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* HIPAA mode toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Healthcare / HIPAA Mode</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xs">
                                    Ensures responses never reference patient details, treatment specifics, or health conditions. Required for HIPAA-regulated industries.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={hipaaMode}
                            onClick={() => setHipaaMode(!hipaaMode)}
                            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${hipaaMode ? "bg-emerald-600" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hipaaMode ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>

                {/* Save AI prefs */}
                <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={handleSave as unknown as React.MouseEventHandler}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                    >
                        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save preferences</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
