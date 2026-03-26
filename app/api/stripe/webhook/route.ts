import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const getStripe = () => {
    return new Stripe(process.env.STRIPE_SECRET_KEY || "missing-key", {
        apiVersion: "2025-02-24.acacia",
    });
};

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            const plan = session.metadata?.plan as "starter" | "professional" | "pro";
            if (!userId || !plan) break;

            const limits = { starter: 100, professional: 500, pro: -1 };
            
            await db.update(users).set({ subscriptionTier: plan }).where(eq(users.id, userId));

            await db.insert(subscriptions).values({
                userId,
                stripeSubscriptionId: session.subscription as string,
                plan,
                responsesLimit: limits[plan],
                status: "active",
                responsesUsedThisMonth: 0,
            }).onConflictDoUpdate({
                target: subscriptions.userId,
                set: {
                    stripeSubscriptionId: session.subscription as string,
                    plan,
                    responsesLimit: limits[plan],
                    status: "active",
                    responsesUsedThisMonth: 0,
                }
            });
            break;
        }

        case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const userProfile = await db.query.users.findFirst({
                where: eq(users.stripeCustomerId, sub.customer as string),
                columns: { id: true }
            });
            if (!userProfile) break;

            await db.update(subscriptions).set({
                status: sub.status,
                periodStart: new Date(sub.current_period_start * 1000),
                periodEnd: new Date(sub.current_period_end * 1000),
            }).where(eq(subscriptions.userId, userProfile.id));
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const userProfile = await db.query.users.findFirst({
                where: eq(users.stripeCustomerId, sub.customer as string),
                columns: { id: true }
            });
            if (!userProfile) break;

            await db.update(subscriptions).set({
                plan: "free",
                responsesLimit: 0,
                status: "canceled",
                stripeSubscriptionId: null,
            }).where(eq(subscriptions.userId, userProfile.id));

            await db.update(users).set({ subscriptionTier: "free" }).where(eq(users.id, userProfile.id));
            break;
        }

        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;
            const userProfile = await db.query.users.findFirst({
                where: eq(users.stripeCustomerId, customerId),
                columns: { id: true }
            });
            if (!userProfile) break;

            await db.update(subscriptions).set({
                responsesUsedThisMonth: 0,
            }).where(eq(subscriptions.userId, userProfile.id));
            break;
        }
    }

    return NextResponse.json({ received: true });
}
