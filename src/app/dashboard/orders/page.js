"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getAdminOrders, updateOrderStatus } from "@/api/order.api";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { extractList } from "@/utils/extractList";
import { formatCurrency, formatDate } from "@/utils/format";

const TABS = ["All", "Paid", "Unpaid", "Cancelled", "Store", "Quotation", "Manual"];
const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PROCESSING",
    "IN_PRODUCTION",
    "COMPLETED",
    "CANCELLED"
];

const STATUS_TONE = {
    PAID: "success",
    COMPLETED: "success",
    CANCELLED: "danger",
    PENDING_PAYMENT: "warning",
    CONFIRMED: "primary",
    PROCESSING: "primary",
    IN_PRODUCTION: "primary"
};

const SOURCE_TONE = {
    QUOTATION: "quotation",
    STORE: "store",
    MANUAL: "dark"
};

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("All");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getAdminOrders({ limit: 200 });
                if (!cancelled) {
                    setOrders(extractList(res?.data, ["orders", "order"]));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load orders");
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
    }, []);

    useEffect(() => {
        const openIfMatch = () => {
            const id = searchParams.get("id");
            if (!id || orders.length === 0) {
                return;
            }

            const match = orders.find((o) => o._id === id);
            if (match) {
                setViewing(match);
                router.replace("/dashboard/orders");
            }
        };

        openIfMatch();
    }, [orders, searchParams, router]);

    const filtered = useMemo(() => {
        switch (tab) {
            case "Paid":
                return orders.filter((o) => o.status === "PAID");
            case "Unpaid":
                return orders.filter((o) => o.status === "PENDING_PAYMENT");
            case "Cancelled":
                return orders.filter((o) => o.status === "CANCELLED");
            case "Store":
                return orders.filter((o) => o.source === "STORE");
            case "Quotation":
                return orders.filter((o) => o.source === "QUOTATION");
            case "Manual":
                return orders.filter((o) => o.source === "MANUAL");
            default:
                return orders;
        }
    }, [orders, tab]);

    const handleStatusChange = async (order, status) => {
        setUpdatingId(order._id);

        try {
            await updateOrderStatus(order._id, status);
            setOrders((prev) =>
                prev.map((o) => (o._id === order._id ? { ...o, status } : o))
            );
        } catch (err) {
            window.alert(err.message || "Failed to update order status");
        } finally {
            setUpdatingId(null);
        }
    };

    const itemCount = (order) =>
        order.items?.length ?? order.orderItems?.length ?? 0;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleTabChange = (item) => {
        setTab(item);
        setPage(1);
    };

    return (
        <div>
            <div className="mb-5 flex flex-wrap gap-2">
                {TABS.map((item) => (
                    <button
                        key={item}
                        onClick={() => handleTabChange(item)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
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
                                <th className="px-5 py-3">Order</th>
                                <th className="px-5 py-3">Source</th>
                                <th className="px-5 py-3">Customer</th>
                                <th className="px-5 py-3">Items</th>
                                <th className="px-5 py-3">Total</th>
                                <th className="px-5 py-3">Order status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && error && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !error && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                                        No orders in this tab
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                !error &&
                                pageRows.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="text-xs font-semibold text-text">
                                                #{order._id}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge tone={SOURCE_TONE[order.source] || "neutral"}>
                                                        {order.source}
                                                    </Badge>
                                                    {typeof order.quotation === "object" &&
                                                        order.quotation?.type && (
                                                            <Badge tone="solid">
                                                                {order.quotation.type}
                                                            </Badge>
                                                        )}
                                                </div>
                                                {typeof order.quotation === "object" &&
                                                    order.quotation?.refNumber && (
                                                        <Badge tone="outline">
                                                            {order.quotation.refNumber}
                                                        </Badge>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-text">
                                                {order.user?.name || "—"}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {order.user?.phone || ""}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 text-text">
                                            {itemCount(order)}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-text">
                                            {formatCurrency(order.pricing?.total)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={order.status}
                                                disabled={updatingId === order._id}
                                                onChange={(e) =>
                                                    handleStatusChange(order, e.target.value)
                                                }
                                                className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
                                            >
                                                {STATUS_OPTIONS.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                onClick={() => setViewing(order)}
                                                className="text-xs font-bold text-accent hover:text-accent-dark"
                                            >
                                                View
                                            </button>
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

            {viewing && (
                <Modal title={`Order #${viewing._id}`} onClose={() => setViewing(null)}>
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Status
                                </p>
                                <Badge tone={STATUS_TONE[viewing.status] || "neutral"}>
                                    {viewing.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Source
                                </p>
                                <p className="font-semibold text-text">{viewing.source}</p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-1 text-xs font-bold uppercase text-text-muted">
                                Customer
                            </p>
                            <p className="font-semibold text-text">
                                {viewing.user?.name || "—"}
                            </p>
                            <p className="text-text-muted">{viewing.user?.phone}</p>
                        </div>

                        {viewing.shippingAddress && (
                            <div>
                                <p className="mb-1 text-xs font-bold uppercase text-text-muted">
                                    Shipping address
                                </p>
                                <p className="text-text">
                                    {viewing.shippingAddress.name},{" "}
                                    {viewing.shippingAddress.addressLine1}{" "}
                                    {viewing.shippingAddress.addressLine2}
                                </p>
                                <p className="text-text-muted">
                                    {viewing.shippingAddress.city},{" "}
                                    {viewing.shippingAddress.state} –{" "}
                                    {viewing.shippingAddress.pincode}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-bg p-4">
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Subtotal
                                </p>
                                <p className="font-semibold text-text">
                                    {formatCurrency(viewing.pricing?.subtotal)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Shipping
                                </p>
                                <p className="font-semibold text-text">
                                    {formatCurrency(viewing.pricing?.shipping)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Tax
                                </p>
                                <p className="font-semibold text-text">
                                    {formatCurrency(viewing.pricing?.tax)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-text-muted">
                                    Total
                                </p>
                                <p className="font-bold text-text">
                                    {formatCurrency(viewing.pricing?.total)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
