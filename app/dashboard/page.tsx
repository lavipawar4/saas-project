import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { businesses, reviews } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { triggerReviewSync } from "@/app/actions/reviews";
import DashboardClient from "@/components/dashboard/DashboardClient";
import type { ReviewWithResponse } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ sync?: string }>;
}) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect("/login");

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
    });

    const params = await searchParams;
    if (params?.sync === "1" && business?.id) {
        await triggerReviewSync(business.id);
    }

    let reviewData: any[] = [];
    if (business?.id) {
        reviewData = await db.query.reviews.findMany({
            where: eq(reviews.businessId, business.id),
            with: {
                responses: true
            },
            orderBy: [desc(reviews.googleCreatedAt)],
            limit: 100
        });
    }

    return (
        <DashboardClient
            reviews={reviewData as ReviewWithResponse[]}
            business={business as any}
        />
    );
}
