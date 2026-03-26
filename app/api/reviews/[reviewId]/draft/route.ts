import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    _request: NextRequest,
    { params }: { params: { reviewId: string } }
) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const response = await db.query.responses.findFirst({
        where: eq(responses.reviewId, params.reviewId),
        columns: { draftText: true, status: true, similarityScore: true }
    });

    if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Map keys to match previous snake_case response for frontend compatibility
    return NextResponse.json({
        draft_text: response.draftText,
        status: response.status,
        similarity_score: response.similarityScore
    });
}
