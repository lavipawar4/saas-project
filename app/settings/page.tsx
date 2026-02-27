import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings, Link as LinkIcon, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, subscription_tier")
        .eq("id", user.id)
        .single();

    const { data: business } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, responses_used_this_month, responses_limit, period_end, status")
        .eq("user_id", user.id)
        .single();

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-400" />
                    Settings
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your business profile and integrations</p>
            </div>

            <div className="space-y-6">
                {/* Google Connection Status */}
                <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-indigo-400" />
                            Google Business Profile
                        </h2>
                        {business?.is_connected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-published text-sm">
                                <CheckCircle className="w-3.5 h-3.5" /> Connected
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-pending text-sm">
                                <AlertCircle className="w-3.5 h-3.5" /> Not connected
                            </span>
                        )}
                    </div>

                    {business?.google_location_name && (
                        <p className="text-sm text-muted-foreground mb-3">
                            Location: <span className="text-foreground">{business.google_location_name}</span>
                        </p>
                    )}
                    {business?.last_synced_at && (
                        <p className="text-sm text-muted-foreground mb-4">
                            Last synced:{" "}
                            <span className="text-foreground">
                                {new Date(business.last_synced_at).toLocaleString()}
                            </span>
                        </p>
                    )}

                    <a
                        href={`/api/auth/google/connect?userId=${user.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                        {business?.is_connected ? "Reconnect Google Account" : "Connect Google Account"}
                    </a>
                </div>

                {/* Business profile settings */}
                {business && (
                    <SettingsForm business={business} />
                )}

                {/* Subscription info */}
                <div className="glass-card rounded-xl p-6">
                    <h2 className="font-semibold mb-4">Subscription</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current plan</span>
                            <span className="font-medium capitalize">{subscription?.plan || "free"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Responses used</span>
                            <span>
                                {subscription?.responses_used_this_month || 0} /{" "}
                                {subscription?.responses_limit === -1 ? "∞" : subscription?.responses_limit || 10}
                            </span>
                        </div>
                        {subscription?.period_end && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Renews</span>
                                <span>{new Date(subscription.period_end).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex gap-3">
                        <a
                            href="/pricing"
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                        >
                            Upgrade plan
                        </a>
                        {subscription?.plan !== "free" && (
                            <a
                                href="/api/stripe/portal"
                                className="px-4 py-2 rounded-lg glass-card border border-border hover:border-indigo-500/30 text-sm font-medium transition-colors"
                            >
                                Manage billing
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
