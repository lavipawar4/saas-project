import { Link2, Sparkles, Eye, Send } from "lucide-react";

const STEPS = [
    {
        icon: Link2,
        step: "01",
        title: "Connect Google",
        desc: "OAuth in one click. ReviewAI syncs your Google Business Profile and pulls in all existing reviews automatically.",
        color: "text-indigo-400",
        border: "border-indigo-500/20",
        bg: "bg-indigo-500/10",
    },
    {
        icon: Sparkles,
        step: "02",
        title: "AI Drafts Responses",
        desc: "Claude reads each review — the star rating, the customer's name, the specific feedback — and writes a tailored reply in under 3 seconds.",
        color: "text-purple-400",
        border: "border-purple-500/20",
        bg: "bg-purple-500/10",
    },
    {
        icon: Eye,
        step: "03",
        title: "You Review & Edit",
        desc: "Browse your draft responses. Tap to edit any word. The character counter and tone indicators keep you on-brand.",
        color: "text-sky-400",
        border: "border-sky-500/20",
        bg: "bg-sky-500/10",
    },
    {
        icon: Send,
        step: "04",
        title: "One-Click Publish",
        desc: "Hit Publish and the response goes live on Google instantly. New reviews? Your dashboard notifies you automatically.",
        color: "text-emerald-400",
        border: "border-emerald-500/20",
        bg: "bg-emerald-500/10",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 px-6 relative">
            {/* Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        From inbox to published
                        <br /><span className="gradient-text">in under 10 minutes</span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Maria responds to 20 restaurant reviews every Sunday. It used to take her 45 minutes. Now it takes 7.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.step} className={`glass-card rounded-2xl p-6 border ${s.border} relative overflow-hidden group hover:-translate-y-0.5 transition-all`}>
                                <div className={`absolute top-0 right-0 text-[100px] font-black ${s.color} opacity-5 leading-none select-none pointer-events-none -mt-4 -mr-4`}>{s.step}</div>
                                <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                                    <Icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <div className={`text-xs font-bold ${s.color} uppercase tracking-widest mb-2`}>Step {s.step}</div>
                                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
