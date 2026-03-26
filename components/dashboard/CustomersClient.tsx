"use client";

import { useState } from "react";
import { Plus, Search, Tag, Mail, Trash2, CheckCircle, AlertCircle, X, ChevronRight, UserPlus, Users, RefreshCw } from "lucide-react";
import { addCustomer, deleteCustomer, sendReviewRequest } from "@/app/actions/automation";

interface Customer {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    tags: string[];
    lastInteractionAt: string | null;
}

interface CustomersClientProps {
    business: { id: string; name: string };
    initialCustomers: Customer[];
}

export default function CustomersClient({ business, initialCustomers }: CustomersClientProps) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addCustomer(business.id, formData);

        if (result.success) {
            window.location.reload();
        } else {
            alert("Error adding customer: " + result.error);
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this customer?")) return;
        const result = await deleteCustomer(id);
        if (result.success) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    }

    async function handleSendRequest(customerId: string) {
        setSendingId(customerId);
        const result = await sendReviewRequest(customerId, business.id);
        if (result.success) {
            alert("Review request sent successfully!");
        } else {
            alert("Failed to send: " + result.error);
        }
        setSendingId(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-1">Manage your customers and automate review collection.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Customer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Customers", value: customers.length, icon: Users, color: "text-blue-400" },
                    { label: "Requests Sent", value: "0", icon: Mail, color: "text-indigo-400" },
                    { label: "Active Tags", value: Array.from(new Set(customers.flatMap(c => c.tags))).length, icon: Tag, color: "text-purple-400" }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="glass-card p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, email or tag..."
                            className="w-full bg-secondary border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-4 md:px-6 py-4">Customer</th>
                                    <th className="px-4 md:px-6 py-4">Tags</th>
                                    <th className="px-4 md:px-6 py-4 hidden md:table-cell">Last interaction</th>
                                    <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-indigo-500/5 transition-colors group">
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center text-xs md:text-sm font-bold text-indigo-400 shrink-0">
                                                    {customer.fullName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate max-w-[120px] md:max-w-none">{customer.fullName}</p>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-none">{customer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {customer.tags.slice(0, 2).map((tag, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] md:text-[10px] font-bold border border-indigo-500/20">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {customer.tags.length > 2 && <span className="text-[9px] text-muted-foreground">+{customer.tags.length - 2}</span>}
                                                {customer.tags.length === 0 && <span className="text-muted-foreground text-[10px] italic">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-xs text-muted-foreground hidden md:table-cell">
                                            {customer.lastInteractionAt
                                                ? new Date(customer.lastInteractionAt).toLocaleDateString()
                                                : "Never"}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button
                                                    onClick={() => handleSendRequest(customer.id)}
                                                    disabled={sendingId === customer.id}
                                                    className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Send Review Request"
                                                >
                                                    {sendingId === customer.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-8 h-8 opacity-20" />
                                                <p>No customers found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Add New Customer</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <input name="fullName" required type="text" placeholder="John Doe" className="w-full bg-secondary border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <input name="email" required type="email" placeholder="john@example.com" className="w-full bg-secondary border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tags (comma separated)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input name="tags" type="text" placeholder="VIP, Recent Buyer..." className="w-full bg-secondary border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Customer"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
