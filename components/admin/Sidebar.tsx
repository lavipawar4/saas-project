"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Zap, PieChart, Star, MapPin, Wand2, 
    Users, Settings, ChevronRight, Menu, X
} from "lucide-react";
import type { User } from "next-auth";

interface AdminSidebarProps {
    user: User;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Badge state mapped from API (can be fetched in layout or sidebar, we'll fetch client-side for dynamic feel)
    const [reviewCount, setReviewCount] = useState<number | string>(0);

    useEffect(() => {
        fetch("/api/admin/data")
            .then(res => res.json())
            .then(data => {
                if (data.stats?.reviewsSynced) {
                    setReviewCount(data.stats.reviewsSynced > 99 ? '99+' : data.stats.reviewsSynced);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-[#4318FF] text-white rounded-lg shadow-lg"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Container */}
            <aside 
                className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#111c44] border-r border-[#2b365e] flex flex-col z-50 transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center px-8 border-b border-[#2b365e] shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4318FF] to-[#868CFF] flex items-center justify-center mr-3">
                        <Zap className="text-white w-4 h-4" />
                    </div>
                    <span className="text-xl font-bold tracking-wide text-white">Review<span className="font-light text-[#a3aed1]">AI</span></span>
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 hide-scrollbar">
                    <p className="text-xs font-semibold text-[#a3aed1] uppercase tracking-wider mb-4 px-4">Overview</p>
                    <ul className="space-y-1 mb-8">
                        <li>
                            <Link href="/admin" className={`flex items-center px-4 py-3 rounded-xl group relative overflow-hidden transition-all ${pathname === '/admin' ? 'bg-[#4318FF]/10 text-[#4318FF]' : 'text-[#a3aed1] hover:bg-[#1b254b] hover:text-white'}`}>
                                {pathname === '/admin' && <div className="absolute inset-y-0 left-0 w-1 bg-[#4318FF] rounded-r"></div>}
                                <PieChart className="w-5 h-5 mr-3" />
                                <span className="font-medium">Dashboard</span>
                            </Link>
                        </li>
                    </ul>

                    <p className="text-xs font-semibold text-[#a3aed1] uppercase tracking-wider mb-4 px-4">Management</p>
                    <ul className="space-y-1">
                        <li>
                            <Link href="/admin/reviews" className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/admin/reviews') ? 'bg-[#4318FF]/10 text-[#4318FF] relative' : 'text-[#a3aed1] hover:bg-[#1b254b] hover:text-white'}`}>
                                {pathname.startsWith('/admin/reviews') && <div className="absolute inset-y-0 left-0 w-1 bg-[#4318FF] rounded-r"></div>}
                                <div className="flex items-center">
                                    <Star className="w-5 h-5 mr-3" />
                                    <span className="font-medium">Reviews</span>
                                </div>
                                <span className="px-2 h-5 rounded-full bg-[#4318FF] text-white text-[10px] flex items-center justify-center font-bold">
                                    {reviewCount}
                                </span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/businesses" className={`flex items-center px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/admin/businesses') ? 'bg-[#4318FF]/10 text-[#4318FF] relative' : 'text-[#a3aed1] hover:bg-[#1b254b] hover:text-white'}`}>
                                {pathname.startsWith('/admin/businesses') && <div className="absolute inset-y-0 left-0 w-1 bg-[#4318FF] rounded-r"></div>}
                                <MapPin className="w-5 h-5 mr-3" />
                                <span className="font-medium">Locations</span>
                            </Link>
                        </li>
                        <li>
                            <button onClick={() => alert('AI Templates feature coming soon!')} className="w-full flex items-center px-4 py-3 text-[#a3aed1] hover:bg-[#1b254b] hover:text-white rounded-xl transition-colors text-left">
                                <Wand2 className="w-5 h-5 mr-3" />
                                <span className="font-medium">AI Templates</span>
                            </button>
                        </li>
                    </ul>
                    
                    <p className="text-xs font-semibold text-[#a3aed1] uppercase tracking-wider mb-4 px-4 mt-8">System</p>
                    <ul className="space-y-1">
                        <li>
                            <Link href="/admin/users" className={`flex items-center px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/admin/users') ? 'bg-[#4318FF]/10 text-[#4318FF] relative' : 'text-[#a3aed1] hover:bg-[#1b254b] hover:text-white'}`}>
                                {pathname.startsWith('/admin/users') && <div className="absolute inset-y-0 left-0 w-1 bg-[#4318FF] rounded-r"></div>}
                                <Users className="w-5 h-5 mr-3" />
                                <span className="font-medium">Users & Plans</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/settings" className="flex items-center px-4 py-3 text-[#a3aed1] hover:bg-[#1b254b] hover:text-white rounded-xl transition-colors">
                                <Settings className="w-5 h-5 mr-3" />
                                <span className="font-medium">Settings</span>
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Link>
                        </li>
                    </ul>
                </div>
            </aside>
            
            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
