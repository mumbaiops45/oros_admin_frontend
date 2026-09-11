"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getAdminOrders } from "@/api/order.api";
import StatCard from "@/components/admin/StatCard";
import { extractList } from "@/utils/extractList";
import { formatCurrency } from "@/utils/format";

const TABS = ["Paid", "Unpaid"];
const PAGE_SIZE = 8;

export default function PaymentsPage() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("Paid");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getAdminOrders({ limit: 200 });
                setOrders(extractList(res?.data, ["orders", "order"]));
            } catch (err) {
                setError(err.message || "Failed to load payments");
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    const paidOrders = useMemo(
        () => orders.filter((o) => o.payment?.status === "PAID"),
        [orders]
    );

    const unpaidOrders = useMemo(
        () => orders.filter((o) => o.payment?.status !== "PAID"),
        [orders]
    );

    const totalCollected = paidOrders.reduce(
        (sum, o) => sum + (o.pricing?.total || 0),
        0
    );

    const pendingAmount = unpaidOrders.reduce(
        (sum, o) => sum + (o.pricing?.total || 0),
        0
    );

    const allRows = tab === "Paid" ? paidOrders : unpaidOrders;
    const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
    const rows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleTabChange = (item) => {
        setTab(item);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total collected" value={formatCurrency(totalCollected)} />
                <StatCard label="Paid orders" value={paidOrders.length} />
                <StatCard label="Pending amount" value={formatCurrency(pendingAmount)} />
                <StatCard label="Unpaid orders" value={unpaidOrders.length} />
            </div>

            <div className="flex gap-2">
                {TABS.map((item) => (
                    <button
                        key={item}
                        onClick={() => handleTabChange(item)}
                        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                            tab === item
                                ? "bg-primary text-white"
                                : "bg-card text-text-muted hover:text-text"
                        }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                                <th className="px-5 py-3">Txn / Order</th>
                                <th className="px-5 py-3">Customer</th>
                                <th className="px-5 py-3">Method</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Paid at</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && error && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !error && rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                                        No {tab.toLowerCase()} payments
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                !error &&
                                rows.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-text">
                                                {order.payment?.transactionId || "—"}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                #{order._id}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-text">
                                                {order.user?.name || "—"}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {order.user?.phone || ""}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 uppercase text-text-muted">
                                            {order.payment?.provider ||
                                                order.payment?.method ||
                                                "—"}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-text">
                                            {formatCurrency(order.pricing?.total)}
                                        </td>
                                        <td className="px-5 py-3 text-text-muted">
                                            {order.payment?.paidAt
                                                ? new Date(
                                                      order.payment.paidAt
                                                  ).toLocaleString("en-IN")
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <p className="text-xs text-text-muted">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-text disabled:opacity-40"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-text disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
