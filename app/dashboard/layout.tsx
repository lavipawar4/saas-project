import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Check onboarding
    const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, full_name, avatar_url, subscription_tier")
        .eq("id", user.id)
        .single();

    if (profile && !profile.onboarding_completed) {
        redirect("/onboarding");
    }

    // Fetch subscription usage
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, responses_used_this_month, responses_limit")
        .eq("user_id", user.id)
        .single();

    return (
        <div className="min-h-screen bg-background flex">
            <DashboardSidebar
                user={user}
                profile={profile}
                subscription={subscription}
            />
            <main className="flex-1 w-full min-h-screen overflow-auto md:pl-64">
                <div className="p-4 md:p-8 pt-20 md:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
