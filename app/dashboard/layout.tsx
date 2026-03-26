import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DashboardSidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const profile = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { onboardingCompleted: true, name: true, image: true, subscriptionTier: true }
    });

    if (profile && !profile.onboardingCompleted) {
        redirect("/onboarding");
    }

    let subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
        columns: { plan: true, responsesUsedThisMonth: true, responsesLimit: true }
    });

    if (!subscription) {
        // Create default subscription for new user (Google/OTP)
        const [newSub] = await db.insert(subscriptions).values({
            userId: user.id,
            plan: "free",
            responsesUsedThisMonth: 0,
            responsesLimit: 10,
        }).returning({
            plan: subscriptions.plan,
            responsesUsedThisMonth: subscriptions.responsesUsedThisMonth,
            responsesLimit: subscriptions.responsesLimit,
        });
        subscription = newSub;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Note: mapped profile structure mapped to match what Sidebar expects now */}
            <DashboardSidebar
                user={user}
                profile={{
                    full_name: profile?.name || "User",
                    avatar_url: profile?.image || null,
                    subscription_tier: profile?.subscriptionTier || "free",
                    role: profile?.role || "user"
                }}
                subscription={subscription ?? null}
            />
            <main className="flex-1 w-full min-h-screen overflow-auto md:pl-64">
                <div className="p-4 md:p-8 pt-20 md:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
