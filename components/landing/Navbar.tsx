"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Star, Menu, X } from "lucide-react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/5 shadow-xl" : "bg-transparent"
            }`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                        <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Review<span className="gradient-text">AI</span></span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                    <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
                    <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                </div>

                {/* CTA buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                        Sign in
                    </Link>
                    <Link href="/signup" className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]">
                        Start free →
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/5 bg-[#0a0f1e]/95 backdrop-blur-xl">
                    <div className="px-6 py-4 space-y-3">
                        <Link href="#features" className="block text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Features</Link>
                        <Link href="#how-it-works" className="block text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>How it works</Link>
                        <Link href="/pricing" className="block text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
                        <div className="pt-2 flex flex-col gap-2">
                            <Link href="/login" className="text-sm text-center py-2.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">Sign in</Link>
                            <Link href="/signup" className="text-sm font-semibold text-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all">Start free →</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
