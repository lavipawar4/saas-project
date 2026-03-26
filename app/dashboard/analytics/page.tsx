import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AnalyticsClient } from "@/components/dashboard/AnalyticsClient";

export default async function AnalyticsPage() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true }
    });

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
