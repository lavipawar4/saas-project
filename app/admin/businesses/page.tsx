import { db } from "@/lib/db";
import { businesses, users, reviews } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { 
    Building2, MapPin, Link2, 
    MoreVertical, Search, ExternalLink, Globe
} from "lucide-react";
import Link from "next/link";

async function getBusinessesData() {
    return await db.query.businesses.findMany({
        with: {
            user: true,
        },
        orderBy: [desc(businesses.createdAt)],
    });
}

export default async function AdminBusinessesPage() {
    const allBusinesses = await getBusinessesData();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-[#FFCE20]" />
                        Locations
                    </h1>
                    <p className="text-sm text-[#a3aed1] mt-1">
                        Manage connected Google Business locations and AI settings
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3aed1] group-focus-within:text-[#FFCE20] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by Name or Owner..." 
                            className="bg-[#111c44] border border-[#2b365e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFCE20] w-full md:w-72 transition-all placeholder-[#a3aed1]"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#111c44] border border-[#2b365e] rounded-2xl overflow-hidden shadow-2xl mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-[#a3aed1] border-b border-[#2b365e]">
                                <th className="px-6 py-4 font-semibold">Business Location</th>
                                <th className="px-6 py-4 font-semibold">Ownership</th>
                                <th className="px-6 py-4 font-semibold">Connection</th>
                                <th className="px-6 py-4 font-semibold">AI Settings</th>
                                <th className="px-6 py-4 font-semibold text-right">Registered</th>
                                <th className="px-6 py-4 font-semibold w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {allBusinesses.map((biz, i) => (
                                <tr key={biz.id} className={`hover:bg-[#1b254b] transition-colors group ${i < allBusinesses.length - 1 ? 'border-b border-[#2b365e]' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#FFCE20]/10 text-[#FFCE20] flex items-center justify-center font-bold">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white font-bold group-hover:text-[#FFCE20] transition-colors truncate max-w-[200px]">{biz.name}</span>
                                                <span className="text-xs text-[#a3aed1] flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    {biz.industry || "General"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-bold text-xs">{biz.user?.name || biz.ownerName || "Unknown"}</span>
                                            <span className="text-xs text-[#a3aed1]">{biz.user?.email || "No email"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {biz.isConnected ? (
                                            <div className="flex flex-col gap-1.5 align-start items-start">
                                                <span className="px-2.5 py-1 rounded-md bg-[#01B574]/10 text-[#01B574] border border-[#01B574]/30 text-xs font-bold inline-flex items-center gap-1.5">
                                                    <Link2 className="w-3 h-3" /> Linked
                                                </span>
                                                <span className="text-[10px] text-[#a3aed1] font-medium truncate max-w-[140px] px-1">{biz.googleLocationName || "Sync Active"}</span>
                                            </div>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-[#a3aed1]/10 text-[#a3aed1] border border-[#a3aed1]/30 text-xs font-bold inline-flex">
                                                Unlinked
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs text-[#6AD2FF] font-bold uppercase">{biz.tone} Tone</span>
                                            <div className="flex gap-1.5">
                                                {biz.autoRespond && (
                                                    <span className="text-[10px] bg-[#01B574]/10 text-[#01B574] px-1.5 py-0.5 rounded font-bold uppercase border border-[#01B574]/30">Auto_Reply</span>
                                                )}
                                                {biz.hipaaMode && (
                                                    <span className="text-[10px] bg-[#EE5D50]/10 text-[#EE5D50] px-1.5 py-0.5 rounded font-bold uppercase border border-[#EE5D50]/30">HIPAA</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-[#a3aed1]">
                                        <span className="font-semibold text-white">{biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-[#a3aed1] hover:text-[#FFCE20] hover:bg-[#FFCE20]/10 rounded-xl transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="px-6 py-4 border-t border-[#2b365e] flex items-center justify-between text-xs text-[#a3aed1] font-medium">
                    <div className="flex items-center gap-6">
                        <span>Total Locations: {allBusinesses.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
