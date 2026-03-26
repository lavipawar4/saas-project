import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { 
    Users, Shield, Mail, Calendar, 
    MoreVertical, Search, Filter, ArrowUpDown, ChevronRight
} from "lucide-react";
import Link from "next/link";

async function getUsersData() {
    return await db.query.users.findMany({
        with: {
            subscriptions: true,
        },
        orderBy: [desc(users.createdAt)],
    });
}

export default async function AdminUsersPage() {
    // @ts-ignore
    const allUsers = await getUsersData();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Users className="w-6 h-6 text-[#4318FF]" />
                        Users & Plans
                    </h1>
                    <p className="text-sm text-[#a3aed1] mt-1">
                        Manage registered users and active subscriptions
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3aed1] group-focus-within:text-[#4318FF] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find by UUID or Email..." 
                            className="bg-[#111c44] border border-[#2b365e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#4318FF] w-full md:w-72 transition-all placeholder-[#a3aed1]"
                        />
                    </div>
                    <button className="p-2.5 bg-[#111c44] border border-[#2b365e] rounded-xl text-[#a3aed1] hover:text-white hover:bg-[#1b254b] transition-all shadow-lg">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="px-5 py-2.5 bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#4318FF]/20">
                        Export Data
                    </button>
                </div>
            </div>

            <div className="bg-[#111c44] border border-[#2b365e] rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-[#a3aed1] border-b border-[#2b365e]">
                                <th className="px-6 py-4 font-semibold w-[30%]">User Identity</th>
                                <th className="px-6 py-4 font-semibold">Privilege</th>
                                <th className="px-6 py-4 font-semibold">Subscription</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Joined</th>
                                <th className="px-6 py-4 font-semibold w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map((user, i) => (
                                <tr key={user.id} className={`hover:bg-[#1b254b] transition-colors group ${i < allUsers.length - 1 ? 'border-b border-[#2b365e]' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4318FF] to-[#868CFF] flex items-center justify-center text-white font-bold uppercase shadow-lg">
                                                {user.name?.charAt(0) || "U"}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white font-bold group-hover:text-[#6AD2FF] transition-colors truncate max-w-[200px]">{user.name || "Unknown Identity"}</span>
                                                <span className="text-xs text-[#a3aed1] flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'admin' ? (
                                            <span className="px-2.5 py-1 rounded-md bg-[#4318FF]/10 text-[#4318FF] border border-[#4318FF]/30 text-xs font-bold inline-flex items-center gap-1.5">
                                                <Shield className="w-3 h-3" /> System Admin
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-[#a3aed1]/10 text-[#a3aed1] border border-[#a3aed1]/20 text-xs font-bold">Standard User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-white font-bold uppercase text-xs">
                                                {user.subscriptionTier || 'Free'}
                                            </span>
                                            {/* @ts-ignore */}
                                            {user.subscriptions && user.subscriptions.length > 0 && (
                                                <div className="h-1.5 w-24 bg-[#0b1437] rounded-full overflow-hidden">
                                                    {/* @ts-ignore */}
                                                    <div className="h-full bg-gradient-to-r from-[#01B574] to-[#6AD2FF] rounded-full" style={{ width: `${Math.min(100, (user.subscriptions[0].responsesUsedThisMonth || 0) / (user.subscriptions[0].responsesLimit || 1) * 100)}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.onboardingCompleted ? (
                                            <span className="text-[#01B574] flex items-center gap-2 font-bold text-xs">
                                                <div className="w-2 h-2 rounded-full bg-[#01B574] shadow-[0_0_8px_rgba(1,181,116,0.5)]" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="text-[#FFCE20] flex items-center gap-2 font-bold text-xs">
                                                <div className="w-2 h-2 rounded-full bg-[#FFCE20]" />
                                                Incomplete
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-[#a3aed1]">
                                        <div className="flex flex-col items-end">
                                            <span className="font-semibold text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="opacity-70">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-[#a3aed1] hover:text-[#4318FF] hover:bg-[#4318FF]/10 rounded-xl transition-all">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="px-6 py-4 border-t border-[#2b365e] flex items-center justify-between text-xs text-[#a3aed1] font-medium">
                    <div className="flex items-center gap-6">
                        <span>Total Users: {allUsers.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
