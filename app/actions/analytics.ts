"use server";

import { db } from "@/lib/db";
import { reviews, responses, businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface DashboardMetrics {
    responseRate: number;
    avgResponseTime: number; // in hours
    editRate: number;
    ratingTrend: { month: string; rating: number }[];
    responseVolume: { month: string; received: number; responded: number }[];
}

export async function getDashboardMetrics(businessId: string): Promise<DashboardMetrics> {
    const bizReviews = await db.query.reviews.findMany({
        where: eq(reviews.businessId, businessId),
        columns: { id: true, status: true, googleCreatedAt: true, starRating: true }
    });

    if (!bizReviews || bizReviews.length === 0) {
        return {
            responseRate: 0,
            avgResponseTime: 0,
            editRate: 0,
            ratingTrend: [],
            responseVolume: [],
        };
    }

    const bizResponses = await db.query.responses.findMany({
        where: eq(responses.businessId, businessId),
        columns: { status: true, publishedAt: true, wasEdited: true, reviewId: true }
    });

    const publishedResponses = bizResponses.filter((r: any) => r.status === "published");
    const totalReviews = bizReviews.length;
    const respondedReviews = publishedResponses.length;

    // Response Rate
    const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0;

    // Avg Response Time
    let totalHours = 0;
    let responseCount = 0;
    publishedResponses.forEach((res: any) => {
        const review = bizReviews.find((rv: any) => rv.id === res.reviewId);
        if (review && review.googleCreatedAt && res.publishedAt) {
            const start = new Date(review.googleCreatedAt).getTime();
            const end = new Date(res.publishedAt).getTime();
            totalHours += (end - start) / (1000 * 60 * 60);
            responseCount++;
        }
    });
    const avgResponseTime = responseCount > 0 ? totalHours / responseCount : 0;

    // Edit Rate
    const totalDrafts = bizResponses.length || 0;
    const editedDrafts = bizResponses.filter((r: any) => r.wasEdited).length || 0;
    const editRate = totalDrafts > 0 ? (editedDrafts / totalDrafts) * 100 : 0;

    // Aggregate Trends (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    // Placeholder logic for Rating Trend & Volume
    const ratingTrend = last6Months.map(month => ({
        month,
        rating: 4.2 + (Math.random() * 0.5)
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
    const bizList = await db.query.businesses.findMany({
        columns: { industry: true },
        with: {
            responses: {
                columns: { wasEdited: true }
            }
        }
    });

    const industryStats: Record<string, { total: number; edited: number }> = {};
    bizList.forEach((biz: any) => {
        const ind = biz.industry || "General";
        if (!industryStats[ind]) industryStats[ind] = { total: 0, edited: 0 };
        biz.responses?.forEach((res: any) => {
            industryStats[ind].total++;
            if (res.wasEdited) industryStats[ind].edited++;
        });
    });

    return Object.entries(industryStats).map(([name, stats]) => ({
        name,
        editRate: stats.total > 0 ? (stats.edited / stats.total) * 100 : 0
    }));
}
