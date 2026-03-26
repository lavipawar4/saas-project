import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/stripe/client";
import { CheckCircle, Star, Zap } from "lucide-react";
import StripePricingButtons from "@/components/pricing/StripePricingButtons";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
    const session = await auth();
    const user = session?.user;

    let currentPlan = "starter";
    if (user && user.id) {
        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.userId, user.id),
            columns: { plan: true }
        });
        currentPlan = sub?.plan || "none";
    }

    const planKeys = ["starter", "professional", "pro"] as const;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Star className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold gradient-text">ReviewAI</span>
                    </Link>
                    {user ? (
                        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            ← Dashboard
                        </Link>
                    ) : (
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Sign in
                        </Link>
                    )}
                </div>
            </nav>

            <div className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
                            <Zap className="w-3.5 h-3.5" /> Simple, transparent pricing
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Choose your <span className="gradient-text">plan</span>
                        </h1>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Upgrade when you&apos;re ready. No hidden fees, cancel anytime.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {planKeys.map((key) => {
                            const plan = (PLANS as any)[key];
                            const isCurrent = currentPlan === key;
                            const isPro = key === "professional";

                            return (
                                <div
                                    key={key}
                                    className={`glass-card rounded-2xl p-7 flex flex-col relative ${isPro ? "border border-indigo-500/40 glow-primary" : ""}`}
                                >
                                    {isPro && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h2 className="font-bold text-lg mb-1">{plan.name}</h2>
                                        <div className="flex items-end gap-1">
                                            <span className="text-4xl font-bold">${plan.price}</span>
                                            <span className="text-muted-foreground text-sm mb-1">/month</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {plan.responses === -1 ? "Unlimited" : plan.responses} AI responses/month
                                        </p>
                                    </div>

                                    <ul className="space-y-3 flex-1 mb-8">
                                        {plan.features.map((feature: string) => (
                                            <li key={feature} className="flex items-center gap-2.5 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <div className="w-full py-3 rounded-xl text-center text-sm font-medium bg-secondary text-muted-foreground">
                                            Current plan
                                        </div>
                                    ) : (
                                        <StripePricingButtons
                                            plan={key as "starter" | "professional" | "pro"}
                                            isLoggedIn={!!user}
                                            userId={user?.id}
                                            userEmail={user?.email || ""}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-muted-foreground text-sm">
                            Questions? <a href="mailto:hello@reviewai.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">Contact us →</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
