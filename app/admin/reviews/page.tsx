import { db } from "@/lib/db";
import { reviews, businesses } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { 
    Star, MessageSquare, Building2, Search, 
    Filter, MoreVertical, Calendar, Globe
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getReviewsData() {
    return await db.query.reviews.findMany({
        with: {
            business: true,
            responses: true,
        },
        orderBy: [desc(reviews.googleCreatedAt)],
        limit: 50,
    });
}

export default async function AdminReviewsPage() {
    // @ts-ignore
    const allReviews = await getReviewsData();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Star className="w-6 h-6 text-[#6AD2FF]" />
                        Global Review Feed
                    </h1>
                    <p className="text-sm text-[#a3aed1] mt-1">
                        Monitor all incoming Google reviews across every business location
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3aed1] group-focus-within:text-[#6AD2FF] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter by reviewer or text..." 
                            className="bg-[#111c44] border border-[#2b365e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6AD2FF] w-full md:w-72 transition-all placeholder-[#a3aed1]"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {allReviews.map((review) => (
                    <div key={review.id} className="bg-[#111c44] border border-[#2b365e] rounded-2xl p-6 hover:border-[#6AD2FF]/50 transition-all group shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#111c44] to-[#1b254b] border border-[#2b365e] flex items-center justify-center text-[#a3aed1] font-bold group-hover:border-[#6AD2FF]/30 transition-all">
                                    {review.reviewerName?.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">{review.reviewerName}</h3>
                                        <span className="text-[10px] text-[#a3aed1] px-2 py-0.5 bg-[#0b1437] rounded-full border border-[#2b365e]">
                                            Google User
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < (review.starRating || 0) ? 'text-[#FFCE20] fill-[#FFCE20]' : 'text-[#2b365e]'}`} />
                                        ))}
                                        <span className="text-[10px] text-[#a3aed1] ml-2 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {review.googleCreatedAt ? new Date(review.googleCreatedAt).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#d1d5db] leading-relaxed max-w-2xl italic">
                                        &quot;{review.comment || "No comment provided."}&quot;
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b1437] rounded-xl border border-[#2b365e] text-xs font-semibold text-white">
                                    <Building2 className="w-3.5 h-3.5 text-[#FFCE20]" />
                                    {review.business?.name || "Unknown Business"}
                                </div>
                                
                                {review.responses && review.responses.length > 0 ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#01B574]/10 rounded-xl border border-[#01B574]/20 text-xs font-bold text-[#01B574]">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        AI Responded
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#a3aed1]/10 rounded-xl border border-[#a3aed1]/20 text-xs font-bold text-[#a3aed1]">
                                        <Globe className="w-3.5 h-3.5" />
                                        Pending
                                    </div>
                                )}
                                
                                <button className="p-2 text-[#a3aed1] hover:text-[#6AD2FF] hover:bg-[#6AD2FF]/10 rounded-lg transition-all mt-auto">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
