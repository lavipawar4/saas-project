import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Personas from "@/components/landing/Personas";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

export const metadata = {
    title: "ReviewAI — AI-Powered Google Review Responses",
    description: "Connect your Google Business Profile, let Claude AI draft personalized responses, and publish in one click. Save hours every month.",
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <Personas />

            {/* CTA Banner */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="glass-card rounded-3xl p-12 border border-white/5 relative overflow-hidden">
                        {/* Glow behind CTA */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-80 h-80 bg-indigo-600/15 rounded-full blur-[80px]" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                                Ready to respond faster<br />
                                <span className="gradient-text">and rank higher?</span>
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                Join businesses already using ReviewAI. Start free — no card required.
                            </p>
                            <Link
                                href="/signup"
                                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03]"
                            >
                                Get started free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                                {["No credit card", "10 free responses/month", "Cancel anytime"].map((item) => (
                                    <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
