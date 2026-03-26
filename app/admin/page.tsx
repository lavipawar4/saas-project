import { db } from "@/lib/db";
import { businesses, reviews, responses, subscriptions } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { 
    Download, ArrowUp, ArrowDown, Star, MapPin, 
    Wand2, CreditCard, MoreHorizontal, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

async function getAdminData() {
    // Total & Sentiment
    const [totalReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const [goodReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.starRating} >= 4`);
    const [badReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.starRating} <= 2`);
    
    // Response Efficiency
    const [responded] = await db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.status} IN ('published', 'auto_published')`);
    const [pending] = await db.select({ count: sql<number>`count(*)` }).from(reviews).where(sql`${reviews.status} IN ('pending', 'unanswered')`);

    // System Stats
    const [locationsCount] = await db.select({ count: sql<number>`count(*)` }).from(businesses).where(eq(businesses.isConnected, true));
    const [activeSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active"));

    const total = Number(totalReviews?.count || 0);
    const good = Number(goodReviews?.count || 0);
    const bad = Number(badReviews?.count || 0);
    const resp = Number(responded?.count || 0);
    const pend = Number(pending?.count || 0);
    const activeS = Number(activeSubs?.count || 0);

    const stats = {
        totalReviews: total,
        goodPercent: total > 0 ? Math.round((good / total) * 100) : 0,
        badPercent: total > 0 ? Math.round((bad / total) * 100) : 0,
        responseRate: total > 0 ? Math.round((resp / total) * 100) : 0,
        unresponded: pend,
        activeSubscriptions: activeS,
        totalResponded: resp,
    };

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

    return { stats, recentResponses };
}

export default async function AdminDashboard() {
    const { stats, recentResponses } = await getAdminData();

    return (
        <>
            <div className="flex justify-between items-end mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">ReviewAI Analytics</h1>
                    <p className="text-[#a3aed1] text-sm">Real-time system health and sentiment analysis.</p>
                </div>
                <button className="bg-[#4318FF] hover:bg-[#4318FF]/90 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-[#4318FF]/30 transition-all flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Run AI Sync
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    label="Total Reviews" 
                    value={stats.totalReviews.toLocaleString()} 
                    icon={<div className="w-12 h-12 rounded-full bg-[#4318FF]/10 flex items-center justify-center text-[#4318FF]"><MessageSquare className="w-5 h-5" /></div>}
                    trend="In Sync"
                    trendValue="Live"
                    trendUp={true}
                    glowColor="bg-[#4318FF]/10 group-hover:bg-[#4318FF]/20"
                    trendColor="text-[#01B574]"
                />
                <StatCard 
                    label="Positive Sentiment" 
                    value={stats.goodPercent + "%"} 
                    icon={<div className="w-12 h-12 rounded-full bg-[#01B574]/10 flex items-center justify-center text-[#01B574]"><Star className="w-5 h-5" /></div>}
                    trend="Bad reviews"
                    trendValue={stats.badPercent + "%"}
                    trendUp={false}
                    glowColor="bg-[#01B574]/10 group-hover:bg-[#01B574]/20"
                    trendColor="text-[#EE5D50]"
                />
                <StatCard 
                    label="Response Efficiency" 
                    value={stats.responseRate + "%"} 
                    icon={<div className="w-12 h-12 rounded-full bg-[#6AD2FF]/10 flex items-center justify-center text-[#6AD2FF]"><Wand2 className="w-5 h-5" /></div>}
                    trend="Pending"
                    trendValue={stats.unresponded}
                    trendUp={false}
                    glowColor="bg-[#6AD2FF]/10 group-hover:bg-[#6AD2FF]/20"
                    trendColor="text-[#FFCE20]"
                />
                <StatCard 
                    label="Active Plans" 
                    value={stats.activeSubscriptions.toLocaleString()} 
                    icon={<div className="w-12 h-12 rounded-full bg-[#FFCE20]/10 flex items-center justify-center text-[#FFCE20]"><CreditCard className="w-5 h-5" /></div>}
                    trend="Premium active"
                    trendValue={stats.activeSubscriptions}
                    trendUp={true}
                    glowColor="bg-[#FFCE20]/10 group-hover:bg-[#FFCE20]/20"
                    trendColor="text-[#01B574]"
                />
            </div>

            {/* Charts & Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* AI Activity Chart */}
                <div className="bg-[#111c44] rounded-2xl p-6 border border-[#2b365e] lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">AI Response Activity</h2>
                        <select className="bg-[#0b1437] text-[#a3aed1] border border-[#2b365e] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#4318FF]">
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="flex-1 flex items-end relative min-h-[250px] w-full mt-4">
                        {/* Chart Lines Background */}
                        <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between text-xs text-[#a3aed1] pb-8 z-0">
                            {[500, 400, 300, 200, 0].map(val => (
                                <div key={val} className="w-full border-t border-[#2b365e]/50 flex items-center">
                                    <span className="bg-[#111c44] pr-2 -mt-2 inline-block">{val}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="w-full h-full flex items-end justify-between px-8 z-10 pb-8 relative pt-4">
                            {/* Bars (Reviews vs AI Responses) */}
                            {[
                                { day: 'Mon', p1: '80%', p2: '75%' },
                                { day: 'Tue', p1: '60%', p2: '55%' },
                                { day: 'Wed', p1: '90%', p2: '88%' },
                                { day: 'Thu', p1: '40%', p2: '35%' },
                                { day: 'Fri', p1: '75%', p2: '70%' },
                            ].map((d, i) => (
                                <div key={i} className="w-1/6 flex flex-col items-center justify-end h-full group relative">
                                    <div className="w-3 bg-[#4318FF] rounded-t-sm mb-1 group-hover:opacity-80 transition-opacity" style={{ height: d.p1 }}></div>
                                    <div className="w-3 bg-[#6AD2FF] rounded-t-sm absolute group-hover:opacity-80 transition-opacity" style={{ height: d.p2, left: 'calc(50% + 8px)' }}></div>
                                    <span className="absolute bottom-0 text-xs text-[#a3aed1]">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center text-sm text-[#a3aed1]"><span className="w-3 h-3 rounded-full bg-[#4318FF] mr-2"></span> Incoming Reviews</div>
                        <div className="flex items-center text-sm text-[#a3aed1]"><span className="w-3 h-3 rounded-full bg-[#6AD2FF] mr-2"></span> AI Generated</div>
                    </div>
                </div>

                {/* Recent AI Responses */}
                <div className="bg-[#111c44] rounded-2xl border border-[#2b365e] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[#2b365e] flex justify-between items-center bg-gradient-to-r from-[#111c44] to-[#1b254b]">
                        <h2 className="text-xl font-bold text-white">Recent Generates</h2>
                        <button className="text-[#a3aed1] hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                {recentResponses.length === 0 ? (
                                    <tr><td className="p-4 text-[#a3aed1] text-sm text-center">No recent AI responses found.</td></tr>
                                ) : recentResponses.map((resp, i) => {
                                    let colorClass = 'bg-[#6AD2FF]/20 text-[#6AD2FF] border-[#6AD2FF]/30';
                                    if (resp.status === 'published' || resp.status === 'auto_published') colorClass = 'bg-[#01B574]/20 text-[#01B574] border-[#01B574]/30';
                                    if (resp.status === 'needs_review') colorClass = 'bg-[#FFCE20]/20 text-[#FFCE20] border-[#FFCE20]/30';
                                    if (resp.status === 'draft') colorClass = 'bg-[#a3aed1]/20 text-[#a3aed1] border-[#a3aed1]/30';
                                    
                                    let statusLabel = (resp.status || 'unknown').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                    
                                    return (
                                        <tr key={resp.id} className={`hover:bg-[#1b254b] transition-colors ${i < recentResponses.length - 1 ? 'border-b border-[#2b365e]' : ''}`}>
                                            <td className="p-4">
                                                <p className="font-semibold text-white">{resp.starRating || 5}-Star Review</p>
                                                <p className="text-xs text-[#a3aed1]">{resp.reviewerName || 'Unknown'} ({resp.businessName || 'Business'})</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`${colorClass} px-2.5 py-1 rounded-md text-xs font-bold border`}>{statusLabel}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, icon, trend, trendValue, trendUp, glowColor, trendColor }: any) {
    return (
        <div className="bg-[#111c44] rounded-2xl p-6 border border-[#2b365e] relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-all ${glowColor}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[#a3aed1] text-sm font-medium mb-1">{label}</p>
                    <h3 className="text-3xl font-bold text-white">{value}</h3>
                </div>
                {icon}
            </div>
            <p className="text-sm flex items-center text-[#a3aed1]">
                <span className={`${trendColor} font-bold mr-2 flex items-center`}>
                    {trendUp ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {trendValue}
                </span> 
                {trend}
            </p>
        </div>
    );
}
