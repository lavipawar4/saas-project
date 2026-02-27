import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Lazy Stripe initialization — avoids crash when STRIPE_SECRET_KEY is not set at build time
function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-02-24.acacia",
    });
}

export const PLANS = {
    free: {
        name: "Free",
        price: 0,
        responses: 10,
        priceId: null,
        features: [
            "10 AI responses/month",
            "1 Business location",
            "Basic tone settings",
            "Email support",
        ],
    },
    starter: {
        name: "Starter",
        price: 29,
        responses: 100,
        priceId: process.env.STRIPE_STARTER_PRICE_ID,
        features: [
            "100 AI responses/month",
            "3 Business locations",
            "Advanced tone & keywords",
            "HIPAA QA checks",
            "Priority support",
        ],
    },
    pro: {
        name: "Pro",
        price: 79,
        responses: -1, // unlimited
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        features: [
            "Unlimited AI responses",
            "Unlimited locations",
            "Custom industry prompts",
            "Similarity engine",
            "API access",
            "Dedicated support",
        ],
    },
} as const;

export async function checkUsageLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    plan: string;
    used: number;
    limit: number;
}> {
    const supabase = await createAdminClient();
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, responses_used_this_month, responses_limit")
        .eq("user_id", userId)
        .single();

    if (!subscription) {
        return { allowed: false, remaining: 0, plan: "free", used: 0, limit: 0 };
    }

    const { plan, responses_used_this_month: used, responses_limit: limit } = subscription;
    const unlimited = limit === -1;
    const remaining = unlimited ? 9999 : Math.max(0, limit - used);
    const allowed = unlimited || used < limit;

    return { allowed, remaining, plan, used, limit };
}

export async function createCheckoutSession(userId: string, plan: "starter" | "pro", userEmail: string): Promise<string> {
    const stripe = getStripe();
    const supabase = await createAdminClient();

    // Get or create Stripe customer
    let { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    const priceId = PLANS[plan].priceId;
    if (!priceId) throw new Error("Invalid plan");

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        metadata: { user_id: userId, plan },
    });

    return session.url!;
}

export async function createPortalSession(userId: string): Promise<string> {
    const stripe = getStripe();
    const supabase = await createAdminClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

    if (!profile?.stripe_customer_id) throw new Error("No Stripe customer found");

    const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return session.url;
}
