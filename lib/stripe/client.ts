import Stripe from "stripe";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-02-24.acacia",
    });
}

export const PLANS = {
    starter: {
        name: "Starter",
        price: 29,
        responses: 100,
        priceId: process.env.STRIPE_STARTER_PRICE_ID,
        features: [
            "100 AI responses/month",
            "Customise according to business",
        ],
    },
    professional: {
        name: "Professional",
        price: 49,
        responses: 500,
        priceId: process.env.STRIPE_PRO_PRICE_ID, 
        features: [
            "500 AI responses/month",
            "Automatic newsletter offers",
            "5 SEO tags",
            "10 keywords",
            "Maintain SEO preference",
        ],
    },
    pro: {
        name: "Pro",
        price: 79,
        responses: 1000, 
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID, 
        features: [
            "1000 AI responses/month",
            "3 Different weekly newsletters",
            "Automatic posting",
            "Maintain SEO",
            "WhatsApp integration",
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
    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
        columns: { plan: true, responsesUsedThisMonth: true, responsesLimit: true }
    });

    if (!subscription) {
        return { allowed: false, remaining: 0, plan: "none", used: 0, limit: 0 };
    }

    const { plan, responsesUsedThisMonth: used, responsesLimit: limit } = subscription;
    const unlimited = limit === -1;
    const remaining = unlimited ? 9999 : Math.max(0, limit - used);
    const allowed = unlimited || used < limit;

    return { allowed, remaining, plan, used, limit };
}

export async function createCheckoutSession(userId: string, plan: "starter" | "professional" | "pro", userEmail: string): Promise<string> {
    const stripe = getStripe();

    let profile = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { stripeCustomerId: true }
    });

    let customerId = profile?.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
        await db.update(users)
            .set({ stripeCustomerId: customerId })
            .where(eq(users.id, userId));
    }

    const priceId = (PLANS as any)[plan].priceId;
    if (!priceId) throw new Error("Invalid plan or missing price ID");

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
    
    const profile = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { stripeCustomerId: true }
    });

    if (!profile?.stripeCustomerId) throw new Error("No Stripe customer found");

    const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return session.url;
}
