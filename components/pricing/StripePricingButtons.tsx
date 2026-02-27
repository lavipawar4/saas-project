"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface StripePricingButtonsProps {
    plan: "starter" | "pro";
    isLoggedIn: boolean;
    userId?: string;
    userEmail?: string;
}

export default function StripePricingButtons({ plan, isLoggedIn, userId, userEmail }: StripePricingButtonsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    async function handleUpgrade() {
        if (!isLoggedIn) {
            router.push("/signup");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan, userId, userEmail }),
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    setError(data.error || "Failed to create checkout session");
                }
            } catch {
                setError("Something went wrong");
            }
        });
    }

    return (
        <div>
            {error && <p className="text-destructive text-xs mb-2">{error}</p>}
            <button
                onClick={handleUpgrade}
                disabled={isPending}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${plan === "pro"
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-secondary hover:bg-muted text-foreground border border-border hover:border-indigo-500/30"
                    } disabled:opacity-50`}
            >
                {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                    `Upgrade to ${plan === "pro" ? "Pro" : "Starter"} →`
                )}
            </button>
        </div>
    );
}
