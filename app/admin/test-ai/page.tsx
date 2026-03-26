import { db } from "@/lib/db";
import { users, businesses, subscriptions, reviews, responses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { 
    Zap, Shield, CheckCircle2, AlertCircle, 
    ArrowRight, MessageSquare, Play, RefreshCw
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getDiagnosticData() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id as string),
        with: {
            businesses: true,
            subscriptions: true,
        }
    });

    const pendingCount = await db.select({ count: sql`count(*)` })
        .from(reviews)
        .where(eq(reviews.status, "pending"));

    return { user, pendingCount: (pendingCount[0] as any).count };
}

import { sql } from "drizzle-orm";

export default async function AITestPage() {
    const data = await getDiagnosticData();
    if (!data) redirect("/login");

    const { user, pendingCount } = data;
    const business = user?.businesses?.[0];
    const sub = user?.subscriptions?.[0];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Zap className="w-8 h-8 text-[#FFCE20]" />
                    AI Automation Diagnostic
                </h1>
                <p className="text-[#a3aed1] mt-2 text-lg">
                    Check if your account is ready for automatic responses.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Condition 1: Pro Plan */}
                <div className={`p-6 rounded-2xl border ${sub?.plan === 'pro' ? 'bg-[#01B574]/5 border-[#01B574]/20' : 'bg-[#EE5D50]/5 border-[#EE5D50]/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${sub?.plan === 'pro' ? 'bg-[#01B574]/10 text-[#01B574]' : 'bg-[#EE5D50]/10 text-[#EE5D50]'}`}>
                            <Shield className="w-6 h-6" />
                        </div>
                        {sub?.plan === 'pro' ? <CheckCircle2 className="text-[#01B574]" /> : <AlertCircle className="text-[#EE5D50]" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Subscription Tier</h3>
                    <p className="text-[#a3aed1] text-sm mb-4">Auto-respond requires the "Pro" plan.</p>
                    <div className="text-white font-mono text-sm bg-black/20 p-2 rounded">
                        Current: <span className="uppercase">{sub?.plan || 'Free'}</span>
                    </div>
                </div>

                {/* Condition 2: Auto-respond Setting */}
                <div className={`p-6 rounded-2xl border ${business?.autoRespond ? 'bg-[#01B574]/5 border-[#01B574]/20' : 'bg-[#EE5D50]/5 border-[#EE5D50]/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${business?.autoRespond ? 'bg-[#01B574]/10 text-[#01B574]' : 'bg-[#EE5D50]/10 text-[#EE5D50]'}`}>
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        {business?.autoRespond ? <CheckCircle2 className="text-[#01B574]" /> : <AlertCircle className="text-[#EE5D50]" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Business Settings</h3>
                    <p className="text-[#a3aed1] text-sm mb-4">Auto-respond must be enabled for this location.</p>
                    <div className="text-white font-mono text-sm bg-black/20 p-2 rounded">
                        Status: <span className="uppercase">{business?.autoRespond ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                </div>
            </div>

            {/* Test Action */}
            <div className="bg-[#111c44] border border-[#2b365e] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#4318FF]/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">Simulate AI Response</h2>
                        <p className="text-[#a3aed1]">
                            Currently <span className="text-white font-bold">{pendingCount} reviews</span> are waiting for a response.
                            Click below to trigger a manual sync and AI generation test.
                        </p>
                    </div>
                    
                    <button className="px-8 py-4 bg-[#4318FF] hover:bg-[#868CFF] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#4318FF]/30 transition-all flex items-center gap-3 active:scale-95 group">
                        <Play className="w-6 h-6 fill-white" />
                        Run Test Flow
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1b254b] rounded-xl border border-[#2b365e] text-center">
                    <p className="text-[#a3aed1] text-xs uppercase font-bold tracking-widest mb-1">Reviews Synced</p>
                    <p className="text-2xl font-extrabold text-white">42</p>
                </div>
                <div className="p-4 bg-[#1b254b] rounded-xl border border-[#2b365e] text-center">
                    <p className="text-[#a3aed1] text-xs uppercase font-bold tracking-widest mb-1">AI Generates</p>
                    <p className="text-2xl font-extrabold text-[#6AD2FF]">28</p>
                </div>
                <div className="p-4 bg-[#1b254b] rounded-xl border border-[#2b365e] text-center">
                    <p className="text-[#a3aed1] text-xs uppercase font-bold tracking-widest mb-1">Auto-Published</p>
                    <p className="text-2xl font-extrabold text-[#01B574]">12</p>
                </div>
            </div>
        </div>
    );
}
