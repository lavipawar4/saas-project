import Link from "next/link";
import { Star, Twitter, Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-white/5 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Star className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                            <span className="font-bold tracking-tight">Review<span className="gradient-text">AI</span></span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
                            AI-powered Google review responses for local businesses. Connect, generate, publish.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-8 h-8 rounded-lg border border-white/10 hover:border-white/20 flex items-center justify-center transition-colors">
                                <Twitter className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-lg border border-white/10 hover:border-white/20 flex items-center justify-center transition-colors">
                                <Github className="w-3.5 h-3.5 text-muted-foreground" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4">Product</h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Features", href: "#features" },
                                { label: "How it works", href: "#how-it-works" },
                                { label: "Pricing", href: "/pricing" },
                                { label: "Dashboard", href: "/dashboard" },
                            ].map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2.5">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                                <li key={l}>
                                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">© 2026 ReviewAI. All rights reserved.</p>
                    <p className="text-xs text-muted-foreground">Built with Claude AI · Powered by Google Business Profile API</p>
                </div>
            </div>
        </footer>
    );
}
