import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { triggerReviewSync } from "@/app/actions/reviews";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { ReviewWithResponse } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ sync?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: business } = await supabase
        .from("businesses")
        .select("id, name, is_connected, last_synced_at")
        .eq("user_id", user.id)
        .single();

    // Handle sync trigger from URL param
    const params = await searchParams;
    if (params?.sync === "1" && business?.id) {
        await triggerReviewSync(business.id);
    }

    const { data: reviews } = await supabase
        .from("reviews")
        .select(`*, responses(*)`)
        .eq("business_id", business?.id || "")
        .order("google_created_at", { ascending: false })
        .limit(100);

    return (
        <DashboardClient
            reviews={(reviews || []) as ReviewWithResponse[]}
            business={business}
        />
    );
}
