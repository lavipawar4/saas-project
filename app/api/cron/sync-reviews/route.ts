import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncReviews } from "@/lib/google/reviews";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Direct DB access bypasses RLS naturally in Drizzle
    const connectedBusinesses = await db.query.businesses.findMany({
        where: eq(businesses.isConnected, true),
        columns: { id: true, name: true }
    });

    console.log(`[Cron] Starting sync for ${connectedBusinesses.length} businesses...`);

    const results = [];
    for (const biz of connectedBusinesses) {
        try {
            const result = await syncReviews(biz.id);
            results.push({
                business: biz.name,
                businessId: biz.id,
                ...result
            });
        } catch (err: any) {
            results.push({
                business: biz.name,
                businessId: biz.id,
                error: err.message
            });
        }
    }

    return NextResponse.json({
        processed: connectedBusinesses.length,
        results
    });
}
