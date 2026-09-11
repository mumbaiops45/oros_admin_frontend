"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getQuotations, updateQuotationByAdmin } from "@/api/quotation.api";
import Modal from "@/components/ui/Modal";
import FormField, { inputClass } from "@/components/ui/FormField";
import Badge from "@/components/ui/Badge";
import { extractList } from "@/utils/extractList";
import { formatCurrency, formatDate } from "@/utils/format";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
    "PENDING",
    "IN_REVIEW",
    "QUOTED",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CONVERTED",
    "CANCELLED"
];

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

export default function QuotationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [quotations, setQuotations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [managing, setManaging] = useState(null);
    const [page, setPage] = useState(1);

    const [refreshKey, setRefreshKey] = useState(0);
    const reload = () => setRefreshKey((key) => key + 1);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getQuotations({ page, limit: PAGE_SIZE });
                if (!cancelled) {
                    setQuotations(
                        extractList(res?.data, ["quotation", "quotations"])
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load quotations");
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
    }, [page, refreshKey]);

    useEffect(() => {
        const id = searchParams.get("id");
        if (!id) {
            return;
        }

        let cancelled = false;

        const findAndOpen = async () => {
            const inCurrentList = quotations.find((q) => q._id === id);
            if (inCurrentList) {
                setManaging(inCurrentList);
                router.replace("/dashboard/quotations");
                return;
            }

            try {
                const res = await getQuotations({ limit: 500 });
                const match = extractList(res?.data, ["quotation", "quotations"]).find(
                    (q) => q._id === id
                );

                if (!cancelled && match) {
                    setManaging(match);
                    router.replace("/dashboard/quotations");
                }
            } catch {
                // notification link couldn't resolve — leave the list as-is
            }
        };

        findAndOpen();

        return () => {
            cancelled = true;
        };
    }, [searchParams, quotations, router]);

    return (
        <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                                <th className="px-5 py-3">Ref</th>
                                <th className="px-5 py-3">Customer</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Items</th>
                                <th className="px-5 py-3">Files</th>
                                <th className="px-5 py-3">Total</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-text-muted">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && error && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !error && quotations.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-text-muted">
                                        No quotations yet
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                !error &&
                                quotations.map((q) => (
                                    <tr
                                        key={q._id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-text">
                                                {q.refNumber}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {formatDate(q.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-text">{q.name}</p>
                                            <p className="text-xs text-text-muted">
                                                {q.phone}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 text-text">{q.type}</td>
                                        <td className="px-5 py-3 text-text">
                                            {q.items?.length || 0}
                                        </td>
                                        <td className="px-5 py-3 text-text-muted">
                                            {q.files?.length || "—"}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-text">
                                            {formatCurrency(q.total)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge tone="neutral">{q.status}</Badge>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                onClick={() => setManaging(q)}
                                                className="text-xs font-bold text-accent hover:text-accent-dark"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <p className="text-xs text-text-muted">Page {page}</p>
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
                            onClick={() => setPage((p) => p + 1)}
                            disabled={quotations.length < PAGE_SIZE}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-text disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {managing && (
                <QuotationModal
                    quotation={managing}
                    onClose={() => setManaging(null)}
                    onSaved={() => {
                        setManaging(null);
                        reload();
                    }}
                />
            )}
        </div>
    );
}

function QuotationModal({ quotation, onClose, onSaved }) {
    const [status, setStatus] = useState(quotation.status);
    const [validTill, setValidTill] = useState(toDateInput(quotation.validTill));
    const [subTotal, setSubTotal] = useState(quotation.subTotal ?? 0);
    const [tax, setTax] = useState(quotation.tax ?? 0);
    const [shipping, setShipping] = useState(quotation.shipping ?? 0);
    const [message, setMessage] = useState("");
    const [items, setItems] = useState(
        (quotation.items || []).map((item) => ({
            id: item._id,
            qty: item.qty,
            unitPrice: item.unitPrice ?? 0,
            tax: item.tax ?? 0
        }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [address, setAddress] = useState({
        name: quotation.shippingAddress?.name || "",
        phone: quotation.shippingAddress?.phone || "",
        addressLine1: quotation.shippingAddress?.addressLine1 || "",
        addressLine2: quotation.shippingAddress?.addressLine2 || "",
        city: quotation.shippingAddress?.city || "",
        state: quotation.shippingAddress?.state || "",
        country: quotation.shippingAddress?.country || "",
        pincode: quotation.shippingAddress?.pincode || ""
    });

    const updateItem = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setFormError("");
        setIsSaving(true);

        try {
            await updateQuotationByAdmin(quotation._id, {
                status,
                validTill: validTill || undefined,
                subTotal: Number(subTotal) || 0,
                tax: Number(tax) || 0,
                shipping: Number(shipping) || 0,
                message: message || undefined,
                shippingAddress: isEditingAddress ? address : undefined,
                items: items.map((item) => ({
                    id: item.id,
                    unitPrice: Number(item.unitPrice) || 0,
                    tax: Number(item.tax) || 0
                }))
            });

            onSaved();
        } catch (err) {
            setFormError(err.message || "Failed to update quotation");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={`Quotation ${quotation.refNumber}`} onClose={onClose} maxWidth="max-w-2xl">
            <div className="mb-5 rounded-xl bg-bg p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <p>
                        <span className="text-text-muted">Name</span>{" "}
                        <span className="font-semibold text-text">{quotation.name}</span>
                    </p>
                    <p>
                        <span className="text-text-muted">Phone</span>{" "}
                        <span className="font-semibold text-text">{quotation.phone}</span>
                    </p>
                    <p>
                        <span className="text-text-muted">Email</span>{" "}
                        <span className="font-semibold text-text">{quotation.email}</span>
                    </p>
                    <p>
                        <span className="text-text-muted">Needed by</span>{" "}
                        <span className="font-semibold text-text">
                            {formatDate(quotation.deadline)}
                        </span>
                    </p>
                </div>

                {quotation.shippingAddress && (
                    <div className="mt-3 border-t border-border pt-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase text-text-muted">
                                Ship to
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsEditingAddress((prev) => !prev)}
                                className="rounded-lg border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent hover:text-white"
                            >
                                {isEditingAddress ? "Cancel" : "Update address"}
                            </button>
                        </div>

                        {!isEditingAddress ? (
                            <p className="text-text">
                                {address.name} · {address.phone} — {address.city},{" "}
                                {address.state}, {address.pincode}, {address.country}
                            </p>
                        ) : (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Name"
                                    className={inputClass}
                                    value={address.name}
                                    onChange={(e) =>
                                        setAddress((p) => ({ ...p, name: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Phone"
                                    className={inputClass}
                                    value={address.phone}
                                    onChange={(e) =>
                                        setAddress((p) => ({ ...p, phone: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Address line 1"
                                    className={`${inputClass} col-span-2`}
                                    value={address.addressLine1}
                                    onChange={(e) =>
                                        setAddress((p) => ({
                                            ...p,
                                            addressLine1: e.target.value
                                        }))
                                    }
                                />
                                <input
                                    placeholder="Address line 2"
                                    className={`${inputClass} col-span-2`}
                                    value={address.addressLine2}
                                    onChange={(e) =>
                                        setAddress((p) => ({
                                            ...p,
                                            addressLine2: e.target.value
                                        }))
                                    }
                                />
                                <input
                                    placeholder="City"
                                    className={inputClass}
                                    value={address.city}
                                    onChange={(e) =>
                                        setAddress((p) => ({ ...p, city: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="State"
                                    className={inputClass}
                                    value={address.state}
                                    onChange={(e) =>
                                        setAddress((p) => ({ ...p, state: e.target.value }))
                                    }
                                />
                                <input
                                    placeholder="Pincode"
                                    className={inputClass}
                                    value={address.pincode}
                                    onChange={(e) =>
                                        setAddress((p) => ({
                                            ...p,
                                            pincode: e.target.value
                                        }))
                                    }
                                />
                                <input
                                    placeholder="Country"
                                    className={inputClass}
                                    value={address.country}
                                    onChange={(e) =>
                                        setAddress((p) => ({
                                            ...p,
                                            country: e.target.value
                                        }))
                                    }
                                />
                                <p className="col-span-2 text-xs text-text-muted">
                                    Changes are saved with the rest of this form.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                        Line items
                    </p>

                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
                            >
                                <p className="min-w-30 flex-1 text-sm text-text">
                                    {quotation.type === "CUSTOM"
                                        ? "Custom item"
                                        : `Product item${item.qty > 1 ? ` · x${item.qty}` : ""}`}
                                </p>
                                <div className="w-28">
                                    <FormField label="Unit price">
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputClass}
                                            value={item.unitPrice}
                                            onChange={(e) =>
                                                updateItem(item.id, "unitPrice", e.target.value)
                                            }
                                        />
                                    </FormField>
                                </div>
                                <div className="w-24">
                                    <FormField label="Tax">
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputClass}
                                            value={item.tax}
                                            onChange={(e) =>
                                                updateItem(item.id, "tax", e.target.value)
                                            }
                                        />
                                    </FormField>
                                </div>
                                <p className="text-xs text-text-muted">
                                    Computed line subtotal:{" "}
                                    {formatCurrency(
                                        (Number(item.unitPrice) || 0) * item.qty
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Status">
                        <select
                            className={inputClass}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Valid till">
                        <input
                            type="date"
                            className={inputClass}
                            value={validTill}
                            onChange={(e) => setValidTill(e.target.value)}
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormField label="Sub total">
                        <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={subTotal}
                            onChange={(e) => setSubTotal(e.target.value)}
                        />
                    </FormField>

                    <FormField label="Tax">
                        <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={tax}
                            onChange={(e) => setTax(e.target.value)}
                        />
                    </FormField>

                    <FormField label="Shipping">
                        <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={shipping}
                            onChange={(e) => setShipping(e.target.value)}
                        />
                    </FormField>
                </div>

                <FormField label="Message to customer">
                    <textarea
                        className={`${inputClass} min-h-20 resize-y`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </FormField>

                {formError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
                >
                    {isSaving ? "Saving..." : "Save quotation"}
                </button>
            </form>
        </Modal>
    );
}
