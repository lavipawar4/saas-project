"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    MessageSquare, Clock, Edit3, Star, TrendingUp, BarChart3
} from "lucide-react";
import { DashboardMetrics, getDashboardMetrics } from "@/app/actions/analytics";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsClient({ businessId }: { businessId: string }) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getDashboardMetrics(businessId);
            setMetrics(data);
            setLoading(false);
        }
        load();
    }, [businessId]);

    if (loading) {
        return (
            <div className="space-y-6 p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!metrics) return null;

    const stats = [
        {
            title: "Response Rate",
            value: `${metrics.responseRate.toFixed(1)}%`,
            description: "Reviews responded to this month",
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Avg Response Time",
            value: `${metrics.avgResponseTime.toFixed(1)}h`,
            description: "Hours from review to publish",
            icon: Clock,
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            title: "AI Helpfulness (Edit Rate)",
            value: `${(100 - metrics.editRate).toFixed(1)}%`,
            description: "Lower edit rate means AI is performing better",
            icon: Edit3,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        }
    ];

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Overview</h1>
                <p className="text-slate-500">Track your business performance and AI efficiency.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm glass-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rating Trend */}
                <Card className="border-none shadow-sm glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <CardTitle>Rating Trend</CardTitle>
                        </div>
                        <CardDescription>Average star rating over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.ratingTrend}>
                                <defs>
                                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="rating" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRating)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Response Volume */}
                <Card className="border-none shadow-sm glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            <CardTitle>Response Volume</CardTitle>
                        </div>
                        <CardDescription>Reviews received vs. responses published</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.responseVolume}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="received" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Received" />
                                <Bar dataKey="responded" fill="#10b981" radius={[4, 4, 0, 0]} name="Responded" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
