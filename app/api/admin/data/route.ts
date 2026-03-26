import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { businesses, reviews, responses, subscriptions } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Stats Counts
    const [reviewsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const [responsesCountRes] = await db.select({ count: sql<number>`count(*)` }).from(responses);
    const [locationsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(businesses).where(eq(businesses.isConnected, true));
    const [subsCountRes] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active"));

    const stats = {
      reviewsSynced: Number(reviewsCountRes?.count || 0),
      aiResponses: Number(responsesCountRes?.count || 0),
      connectedLocations: Number(locationsCountRes?.count || 0),
      activeSubscriptions: Number(subsCountRes?.count || 0),
    };

    // 2. Recent Generates (Join responses with reviews and businesses)
    const recentResponses = await db
        .select({
            id: responses.id,
            status: responses.status,
            reviewerName: reviews.reviewerName,
            starRating: reviews.starRating,
            businessName: businesses.name,
        })
        .from(responses)
        .leftJoin(reviews, eq(responses.reviewId, reviews.id))
        .leftJoin(businesses, eq(responses.businessId, businesses.id))
        .orderBy(desc(responses.createdAt))
        .limit(4);

    // 3. Chart Data (Mocking for now to avoid complex time-series queries)
    const chartData = [
        { day: 'Mon', reviews: 250, generated: 200 },
        { day: 'Tue', reviews: 300, generated: 280 },
        { day: 'Wed', reviews: 450, generated: 420 },
        { day: 'Thu', reviews: 200, generated: 180 },
        { day: 'Fri', reviews: 380, generated: 350 },
    ];

    return NextResponse.json({ stats, recentResponses, chartData });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

