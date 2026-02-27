const PERSONAS = [
    {
        avatar: "M",
        gradient: "from-orange-400 to-red-500",
        name: "Maria",
        role: "Restaurant Owner",
        quote: "I used to spend 45 minutes every Sunday responding to reviews. Now I batch-process all 20 in under 7 minutes. The food-specific vocabulary is spot on.",
        stars: 5,
        tag: "Batch processing",
        tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    {
        avatar: "K",
        gradient: "from-blue-400 to-indigo-500",
        name: "Dr. Kevin",
        role: "Dental Office Manager",
        quote: "HIPAA compliance was my biggest concern. ReviewAI never confirms patient details — it acknowledges the review professionally and always includes our booking CTA.",
        stars: 5,
        tag: "HIPAA-safe",
        tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
        avatar: "J",
        gradient: "from-green-400 to-emerald-500",
        name: "Jake",
        role: "HVAC Business Owner",
        quote: "I respond between jobs from my phone. The mobile editor is super clean, responses are short and casual like I'd actually say them — not corporate BS.",
        stars: 5,
        tag: "Mobile-first",
        tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
];

export default function Personas() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Real stories</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Built for every
                        <br /><span className="gradient-text">local business</span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Whether you run a restaurant, a dental practice, or a one-person trade shop — ReviewAI adapts to your voice.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {PERSONAS.map((p) => (
                        <div key={p.name} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5 flex flex-col">
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {"★★★★★".split("").map((s, i) => (
                                    <span key={i} className="text-yellow-400 text-sm">{s}</span>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                                &ldquo;{p.quote}&rdquo;
                            </p>

                            {/* Profile */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                    {p.avatar}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">{p.role}</div>
                                </div>
                                <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-medium ${p.tagColor}`}>
                                    {p.tag}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
