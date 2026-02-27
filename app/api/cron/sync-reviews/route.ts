import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { syncReviews } from "@/lib/google/reviews";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Job endpoint: GET /api/cron/sync-reviews
 * Secure with header Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = await createAdminClient();

    // Fetch all businesses that are connected to Google
    const { data: businesses, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("is_connected", true);

    if (error) {
        console.error("[Cron] Failed to fetch businesses:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Cron] Starting sync for ${businesses.length} businesses...`);

    const results = [];
    for (const biz of businesses) {
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
        processed: businesses.length,
        results
    });
}
