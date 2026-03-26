import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { businesses, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import CustomersClient from "@/components/dashboard/CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true, name: true }
    });

    if (!business) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h2 className="text-2xl font-bold mb-2">No business found</h2>
                <p className="text-muted-foreground">Please connect your Google Business Profile first.</p>
            </div>
        );
    }

    const customerList = await db.query.customers.findMany({
        where: eq(customers.businessId, business.id),
        orderBy: [desc(customers.createdAt)]
    });

    return (
        <CustomersClient
            business={business as any}
            initialCustomers={customerList as any}
        />
    );
}
