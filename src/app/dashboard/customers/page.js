"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import OrdersView from "@/components/admin/OrdersView";
import { getUsers } from "@/api/user.api";
import { extractList } from "@/utils/extractList";
import { formatDate } from "@/utils/format";

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getUsers({
                    role: "user",
                    ...(submittedSearch ? { phone: submittedSearch } : {})
                });
                if (!cancelled) {
                    setCustomers(extractList(res?.data, ["users", "user"]));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load customers");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [submittedSearch]);

    const handleSearch = (event) => {
        event.preventDefault();
        setSubmittedSearch(search);
    };

    const openOrders = (customer) => {
        setSelected(customer);
    };

    if (selected) {
        return (
            <OrdersView
                userId={selected._id}
                customerName={selected.name}
                customer={selected}
                onBack={() => setSelected(null)}
            />
        );
    }

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by phone"
                            className="rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
                        />
                    </div>
                </form>
            </div>

            {isLoading && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-text-muted">
                    Loading...
                </div>
            )}

            {!isLoading && error && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-red-500">
                    {error}
                </div>
            )}

            {!isLoading && !error && customers.length === 0 && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-text-muted">
                    No customers found
                </div>
            )}

            {!isLoading && !error && customers.length > 0 && (
                <>
                    {/* Mobile: one card per customer */}
                    <div className="space-y-3 md:hidden">
                        {customers.map((customer) => (
                            <button
                                key={customer._id}
                                onClick={() => openOrders(customer)}
                                className="block w-full rounded-2xl border border-border bg-card p-4 text-left"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-text">
                                            {customer.name}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {customer.phone}
                                        </p>
                                        <p className="truncate text-xs text-text-muted">
                                            {customer.email}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-accent">
                                        View orders
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">Phone</th>
                                        <th className="px-5 py-3">Email</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Joined</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => (
                                        <tr
                                            key={customer._id}
                                            onClick={() => openOrders(customer)}
                                            className="cursor-pointer border-b border-border last:border-0 hover:bg-bg"
                                        >
                                            <td className="px-5 py-3 font-semibold text-text">
                                                {customer.name}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {customer.phone}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {customer.email}
                                            </td>
                                            <td className="px-5 py-3 capitalize text-text-muted">
                                                {customer.accountType}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className="text-xs font-bold text-accent hover:text-accent-dark">
                                                    View orders
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
