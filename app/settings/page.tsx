import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, businesses, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings, Link as LinkIcon, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const profile = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { name: true, email: true, subscriptionTier: true }
    });

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id)
    });

    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
        columns: { plan: true, responsesUsedThisMonth: true, responsesLimit: true, periodEnd: true, status: true }
    });

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
                <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-indigo-400" />
                            Google Business Profile
                        </h2>
                        {business?.isConnected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-published text-sm">
                                <CheckCircle className="w-3.5 h-3.5" /> Connected
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-pending text-sm">
                                <AlertCircle className="w-3.5 h-3.5" /> Not connected
                            </span>
                        )}
                    </div>

                    {business?.googleLocationName && (
                        <p className="text-sm text-muted-foreground mb-3">
                            Location: <span className="text-foreground">{business.googleLocationName}</span>
                        </p>
                    )}
                    {business?.lastSyncedAt && (
                        <p className="text-sm text-muted-foreground mb-4">
                            Last synced:{" "}
                            <span className="text-foreground">
                                {new Date(business.lastSyncedAt).toLocaleString()}
                            </span>
                        </p>
                    )}

                    <a
                        href={`/api/auth/google/connect?userId=${user.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                        {business?.isConnected ? "Reconnect Google Account" : "Connect Google Account"}
                    </a>
                </div>

                {business && (
                    <SettingsForm business={business as any} />
                )}

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
                                {subscription?.responsesUsedThisMonth || 0} /{" "}
                                {subscription?.responsesLimit === -1 ? "∞" : subscription?.responsesLimit || 10}
                            </span>
                        </div>
                        {subscription?.periodEnd && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Renews</span>
                                <span>{new Date(subscription.periodEnd).toLocaleDateString()}</span>
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
                        {subscription?.plan !== "free" && subscription?.plan !== "none" && subscription?.plan !== null && (
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
