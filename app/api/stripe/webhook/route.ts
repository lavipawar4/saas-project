import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
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

    const supabase = await createAdminClient();

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            const plan = session.metadata?.plan as "starter" | "pro";
            if (!userId || !plan) break;

            const limits = { starter: 100, pro: -1 };
            await supabase.from("subscriptions").update({
                stripe_subscription_id: session.subscription as string,
                plan,
                responses_limit: limits[plan],
                status: "active",
                responses_used_this_month: 0,
            }).eq("user_id", userId);

            await supabase.from("profiles").update({ subscription_tier: plan }).eq("id", userId);
            break;
        }

        case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("stripe_customer_id", sub.customer as string)
                .single();

            if (!profile) break;

            const status = sub.status as string;
            await supabase.from("subscriptions").update({
                status,
                period_start: new Date(sub.current_period_start * 1000).toISOString(),
                period_end: new Date(sub.current_period_end * 1000).toISOString(),
            }).eq("user_id", profile.id);
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("stripe_customer_id", sub.customer as string)
                .single();

            if (!profile) break;

            await supabase.from("subscriptions").update({
                plan: "free",
                responses_limit: 10,
                status: "canceled",
                stripe_subscription_id: null,
            }).eq("user_id", profile.id);

            await supabase.from("profiles").update({ subscription_tier: "free" }).eq("id", profile.id);
            break;
        }

        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("stripe_customer_id", customerId)
                .single();

            if (!profile) break;

            // Reset monthly usage counter on new billing period
            await supabase.from("subscriptions").update({
                responses_used_this_month: 0,
            }).eq("user_id", profile.id);
            break;
        }
    }

    return NextResponse.json({ received: true });
}
