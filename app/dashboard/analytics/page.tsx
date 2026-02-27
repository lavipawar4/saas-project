import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/dashboard/AnalyticsClient";

export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!business) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">No Business Found</h2>
                <p className="text-slate-500 mb-6">Connect your Google Business Profile to see analytics.</p>
            </div>
        );
    }

    return <AnalyticsClient businessId={business.id} />;
}
