import { Zap, ShieldCheck, RefreshCw, BarChart2, Smartphone, Users } from "lucide-react";

const FEATURES = [
    {
        icon: Zap,
        color: "from-indigo-500 to-blue-500",
        glow: "shadow-indigo-500/20",
        title: "Claude AI Generation",
        desc: "Each response is uniquely crafted using your business name, industry, tone, and branded keywords — never cookie-cutter.",
    },
    {
        icon: ShieldCheck,
        color: "from-emerald-500 to-teal-500",
        glow: "shadow-emerald-500/20",
        title: "HIPAA-Safe by Default",
        desc: "Dental and healthcare businesses get responses that acknowledge sentiment without confirming patient relationships — compliance built in.",
    },
    {
        icon: RefreshCw,
        color: "from-purple-500 to-pink-500",
        glow: "shadow-purple-500/20",
        title: "Variety Engine",
        desc: "Our similarity checker ensures no two responses share more than 40% of phrasing. Your profile never looks copy-pasted.",
    },
    {
        icon: BarChart2,
        color: "from-orange-500 to-amber-500",
        glow: "shadow-orange-500/20",
        title: "Analytics Dashboard",
        desc: "Track your publish rate, edit frequency, and variety scores. See exactly how ReviewAI is saving you time every month.",
    },
    {
        icon: Smartphone,
        color: "from-sky-500 to-cyan-500",
        glow: "shadow-sky-500/20",
        title: "Mobile-First Editor",
        desc: "Respond from your phone between jobs. The clean tap-to-edit interface is built for quick reviews on any device.",
    },
    {
        icon: Users,
        color: "from-rose-500 to-red-500",
        glow: "shadow-rose-500/20",
        title: "One-Click Publish",
        desc: "Approved responses post directly to Google Business Profile via the official API. No copy-paste, no extra logins.",
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Everything you need to<br />
                        <span className="gradient-text">dominate local SEO</span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Built for the real pain of review management — from HIPAA compliance to mobile-first editing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div key={f.title} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group hover:-translate-y-0.5">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
