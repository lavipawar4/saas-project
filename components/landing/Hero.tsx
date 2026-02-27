"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";

function useCountUp(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

const STATS = [
    { value: 12400, suffix: "+", label: "Reviews responded" },
    { value: 92, suffix: "%", label: "Published without edits" },
    { value: 2.4, suffix: "s", label: "Avg generation time", decimal: true },
    { value: 5, suffix: "★", label: "Average user rating" },
];

export default function Hero() {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const c0 = useCountUp(12400, 2000, visible);
    const c1 = useCountUp(92, 1500, visible);
    const c3 = useCountUp(5, 1000, visible);

    return (
        <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
            {/* Background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
                <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "60px 60px"
                }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center">
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Powered by Claude AI · Now in beta
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
                    Respond to every{" "}
                    <span className="gradient-text">Google review</span>
                    <br />in seconds, not hours
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "200ms" }}>
                    ReviewAI connects to your Google Business Profile, reads each review, and writes
                    a unique, on-brand response — ready to publish with one click.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "300ms" }}>
                    <Link href="/signup" className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03]">
                        Start free — 10 responses/month
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link href="#how-it-works" className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-sm font-medium transition-all hover:bg-white/5">
                        <Play className="w-4 h-4 fill-current" />
                        See how it works
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/5 bg-white/5 animate-fade-in" style={{ animationDelay: "400ms" }}>
                    {[
                        { display: visible ? c0.toLocaleString() : "0", suffix: "+", label: "Reviews responded" },
                        { display: visible ? c1.toString() : "0", suffix: "%", label: "Published without edits" },
                        { display: "2.4", suffix: "s", label: "Avg generation time" },
                        { display: visible ? c3.toString() : "0", suffix: "★", label: "Average user rating" },
                    ].map((s) => (
                        <div key={s.label} className="bg-[#0a0f1e] px-6 py-6 text-center">
                            <div className="text-3xl font-extrabold tracking-tight">
                                {s.display}<span className="text-indigo-400">{s.suffix}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating mock review card */}
            <div className="relative z-10 mt-16 max-w-lg mx-auto w-full animate-fade-in" style={{ animationDelay: "500ms" }}>
                <div className="glass-card rounded-2xl p-5 border border-white/8 shadow-2xl">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">M</div>
                        <div>
                            <div className="font-medium text-sm">Maria C.</div>
                            <div className="flex gap-0.5 mt-0.5">{"★★★★★".split("").map((s, i) => <span key={i} className="text-yellow-400 text-xs">{s}</span>)}</div>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">2 min ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;Amazing pasta! The carbonara was absolutely perfect and our waiter Marco was so attentive. Will definitely be back for our anniversary dinner.&rdquo;</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">AI response ready in 2.1s</span>
                        <button className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">Publish →</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
