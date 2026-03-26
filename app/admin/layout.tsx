import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/Sidebar";
import { Search, Bell, RotateCw, Menu } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    // Strict admin check
    // @ts-ignore
    if (!user || user.role !== "admin") {
        redirect("/dashboard");
    }

    return (
        <div className="bg-[#0b1437] text-white min-h-screen flex overflow-hidden font-sans">
            {/* Sidebar */}
            <AdminSidebar user={user} />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Top Navbar */}
                <header className="h-20 bg-[#0b1437]/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center">
                        <button className="text-[#a3aed1] hover:text-white transition-colors mr-6 md:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3aed1] w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Search reviews, users..." 
                                className="bg-[#111c44] text-white pl-11 pr-4 py-2.5 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/50 border border-[#2b365e] placeholder-[#a3aed1] text-sm transition-all focus:w-80"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-5">
                        <button className="relative text-[#a3aed1] hover:text-[#4318FF] transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EE5D50] rounded-full border-2 border-[#0b1437]"></span>
                        </button>
                        <button className="text-[#a3aed1] hover:text-[#4318FF] transition-colors">
                            <RotateCw className="w-5 h-5" />
                        </button>
                        <Link href="/profile" className="flex items-center gap-3 pl-4 border-l border-[#2b365e] cursor-pointer hover:opacity-80 transition-opacity">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=4318FF&color=fff&rounded=true`} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full border-2 border-[#4318FF]/20"
                            />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-white leading-tight">{user?.name || "Lavi Pawar"}</p>
                                <p className="text-xs text-[#a3aed1]">Super Admin</p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8 hide-scrollbar">
                    {children}
                    
                    {/* Footer */}
                    <footer className="mt-8 pt-6 border-t border-[#2b365e] flex flex-col md:flex-row justify-between items-center text-sm text-[#a3aed1]">
                        <p>&copy; 2026 ReviewAI Dashboard. All Rights Reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Support</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
