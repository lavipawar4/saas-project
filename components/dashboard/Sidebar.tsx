"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Settings, Star, CreditCard, LogOut, Zap, Menu, X, MessageSquare, BarChart3, Users, Shield
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { User } from "next-auth";

interface SidebarProps {
    user: User;
    profile: {
        full_name: string | null;
        avatar_url: string | null;
        subscription_tier: string;
        role?: string;
    } | null;
    subscription: {
        plan: string;
        responsesUsedThisMonth?: number;
        responsesLimit?: number;
    } | null;
    autoRespond?: boolean;
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "Reviews", icon: MessageSquare },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Business Profile", icon: Settings },
    { href: "/pricing", label: "Upgrade", icon: CreditCard },
];

export default function DashboardSidebar({ user, profile, subscription, autoRespond }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const used = subscription?.responsesUsedThisMonth || 0;
    const limit = subscription?.responsesLimit || 10;
    
    const usagePercent = subscription
        ? limit === -1
            ? 0
            : Math.min(100, (used / limit) * 100)
        : 0;

    const planLabels: Record<string, string> = {
        free: "Free Plan",
        starter: "Starter",
        pro: "Pro",
        professional: "Professional"
    };

    const planColors: Record<string, string> = {
        free: "text-muted-foreground",
        starter: "text-blue-400",
        professional: "text-purple-400",
        pro: "text-indigo-400",
    };

    return (
        <>
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-card border-b border-border flex items-center justify-between px-4 z-40">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold gradient-text text-lg">ReviewAI</span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 h-screen w-64 glass-card border-r border-border flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold gradient-text">ReviewAI</span>
                        {autoRespond && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                AUTO
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 text-muted-foreground hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                    
                    {profile?.role === "admin" && (
                         <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20`}
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}
                </nav>

                {subscription && (
                    <div className="p-4 border-t border-border">
                        <div className="glass-card rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-xs font-medium">AI Responses</span>
                                </div>
                                <span className={`text-xs font-semibold ${planColors[subscription.plan] || "text-muted-foreground"}`}>
                                    {planLabels[subscription.plan] || subscription.plan}
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5 mb-1.5">
                                <div
                                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {limit === -1
                                    ? "Unlimited"
                                    : `${used} / ${limit}`}
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-semibold shrink-0">
                            {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
