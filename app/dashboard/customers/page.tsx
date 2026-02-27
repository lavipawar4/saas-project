import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersClient from "@/components/dashboard/CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: business } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("user_id", user.id)
        .single();

    if (!business) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h2 className="text-2xl font-bold mb-2">No business found</h2>
                <p className="text-muted-foreground">Please connect your Google Business Profile first.</p>
            </div>
        );
    }

    const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

    return (
        <CustomersClient
            business={business}
            initialCustomers={customers || []}
        />
    );
}
