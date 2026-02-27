import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: { reviewId: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: response } = await supabase
        .from("responses")
        .select("draft_text, status, similarity_score")
        .eq("review_id", params.reviewId)
        .single();

    if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(response);
}
