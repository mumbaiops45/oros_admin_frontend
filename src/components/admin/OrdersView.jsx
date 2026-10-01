"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getAdminOrders, updateOrderStatus } from "@/api/order.api";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { extractList } from "@/utils/extractList";
import { formatCurrency, formatDate } from "@/utils/format";

const TABS = ["All", "Paid", "Unpaid", "Cancelled", "Store", "Quotation", "Manual"];
const PAGE_SIZE = 8;

// Query params sent to the server for each tab
const TAB_FILTERS = {
    All: {},
    Paid: { paymentStatus: "PAID" },
    Unpaid: { status: "PENDING_PAYMENT" },
    Cancelled: { status: "CANCELLED" },
    Store: { source: "STORE" },
    Quotation: { source: "QUOTATION" },
    Manual: { source: "MANUAL" }
};

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

export default function OrdersView({ userId = "", customerName = "", onBack }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("All");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getAdminOrders({
                    ...TAB_FILTERS[tab],
                    ...(userId ? { userId } : {}),
                    page,
                    limit: PAGE_SIZE
                });
                if (!cancelled) {
                    setOrders(extractList(res?.data, ["orders", "order"]));
                    setTotalPages(
                        Math.max(1, res?.data?.pagination?.totalPages || 1)
                    );
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
    }, [tab, page, userId]);

    useEffect(() => {
        const openIfMatch = () => {
            const id = searchParams.get("id");
            if (userId || !id || orders.length === 0) {
                return;
            }

            const match = orders.find((o) => o._id === id);
            if (match) {
                setViewing(match);
                router.replace("/dashboard/orders");
            }
        };

        openIfMatch();
    }, [orders, searchParams, router, userId]);

    // Filtering and pagination are done by the server
    const filtered = orders;

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

    const pageRows = filtered;

    const handleTabChange = (item) => {
        setTab(item);
        setPage(1);
    };

    return (
        <div>
            {userId && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3">
                    <p className="text-sm font-semibold text-text">
                        Orders of {customerName || "customer"}
                    </p>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark"
                    >
                        <ChevronLeft size={14} />
                        Back to customers
                    </button>
                </div>
            )}

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

            {!isLoading && !error && filtered.length === 0 && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-text-muted">
                    No orders in this tab
                </div>
            )}

            {!isLoading && !error && filtered.length > 0 && (
                <>
                    {/* Mobile: one card per order, all details stacked — no horizontal scrolling */}
                    <div className="space-y-3 md:hidden">
                        {pageRows.map((order) => (
                            <div
                                key={order._id}
                                className="rounded-2xl border border-border bg-card p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-text">
                                            #{order._id}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setViewing(order)}
                                        className="shrink-0 text-xs font-bold text-accent hover:text-accent-dark"
                                    >
                                        View
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <Badge tone={SOURCE_TONE[order.source] || "neutral"}>
                                        {order.source}
                                    </Badge>
                                    {typeof order.quotation === "object" &&
                                        order.quotation?.type && (
                                            <Badge tone="solid">{order.quotation.type}</Badge>
                                        )}
                                    {typeof order.quotation === "object" &&
                                        order.quotation?.refNumber && (
                                            <Badge tone="outline">
                                                {order.quotation.refNumber}
                                            </Badge>
                                        )}
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-text-muted">
                                            Customer
                                        </p>
                                        <p className="font-medium text-text">
                                            {order.user?.name || "—"}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {order.user?.phone || ""}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-text-muted">
                                            Items · Total
                                        </p>
                                        <p className="font-semibold text-text">
                                            {itemCount(order)} items ·{" "}
                                            {formatCurrency(order.pricing?.total)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 border-t border-border pt-3">
                                    <p className="mb-1.5 text-xs font-bold uppercase text-text-muted">
                                        Order status
                                    </p>
                                    <select
                                        value={order.status}
                                        disabled={updatingId === order._id}
                                        onChange={(e) =>
                                            handleStatusChange(order, e.target.value)
                                        }
                                        className="w-full rounded-lg border border-border bg-white px-2 py-2 text-xs font-semibold text-text outline-none focus:border-primary"
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
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
                                    {pageRows.map((order) => (
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
                    </div>
                </>
            )}

            {!isLoading && !error && filtered.length > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3">
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
            )}

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
