"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
    responseRate: number;
    avgResponseTime: number; // in hours
    editRate: number;
    ratingTrend: { month: string; rating: number }[];
    responseVolume: { month: string; received: number; responded: number }[];
}

export async function getDashboardMetrics(businessId: string): Promise<DashboardMetrics> {
    const supabase = await createClient();

    // 1. Fetch all reviews for this business
    const { data: reviews } = await supabase
        .from("reviews")
        .select("id, status, google_created_at, star_rating")
        .eq("business_id", businessId);

    if (!reviews) {
        return {
            responseRate: 0,
            avgResponseTime: 0,
            editRate: 0,
            ratingTrend: [],
            responseVolume: [],
        };
    }

    // 2. Fetch all responses for these reviews
    const { data: responses } = await supabase
        .from("responses")
        .select("status, published_at, was_edited, review_id")
        .eq("business_id", businessId);

    const publishedResponses = responses?.filter(r => r.status === "published") || [];
    const totalReviews = reviews.length;
    const respondedReviews = publishedResponses.length;

    // Response Rate
    const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0;

    // Avg Response Time
    let totalHours = 0;
    let responseCount = 0;
    publishedResponses.forEach(res => {
        const review = reviews.find(rv => rv.id === res.review_id);
        if (review && review.google_created_at && res.published_at) {
            const start = new Date(review.google_created_at).getTime();
            const end = new Date(res.published_at).getTime();
            totalHours += (end - start) / (1000 * 60 * 60);
            responseCount++;
        }
    });
    const avgResponseTime = responseCount > 0 ? totalHours / responseCount : 0;

    // Edit Rate
    const totalDrafts = responses?.length || 0;
    const editedDrafts = responses?.filter(r => r.was_edited).length || 0;
    const editRate = totalDrafts > 0 ? (editedDrafts / totalDrafts) * 100 : 0;

    // Aggregate Trends (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    // Placeholder logic for Rating Trend & Volume (would normally use SQL group by)
    const ratingTrend = last6Months.map(month => ({
        month,
        rating: 4.2 + (Math.random() * 0.5) // Simulation for now
    }));

    const responseVolume = last6Months.map(month => ({
        month,
        received: Math.floor(Math.random() * 20) + 5,
        responded: Math.floor(Math.random() * 15) + 2
    }));

    return {
        responseRate,
        avgResponseTime,
        editRate,
        ratingTrend,
        responseVolume,
    };
}

export async function getInternalProductAnalytics() {
    const supabase = await createClient();

    // Industry Edit Rates
    const { data: industries } = await supabase
        .from("businesses")
        .select("industry, responses(was_edited)");

    const industryStats: Record<string, { total: number; edited: number }> = {};
    industries?.forEach(biz => {
        const ind = biz.industry || "General";
        if (!industryStats[ind]) industryStats[ind] = { total: 0, edited: 0 };
        (biz as any).responses?.forEach((res: any) => {
            industryStats[ind].total++;
            if (res.was_edited) industryStats[ind].edited++;
        });
    });

    return Object.entries(industryStats).map(([name, stats]) => ({
        name,
        editRate: stats.total > 0 ? (stats.edited / stats.total) * 100 : 0
    }));
}
