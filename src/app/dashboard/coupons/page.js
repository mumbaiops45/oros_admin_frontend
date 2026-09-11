"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import {
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
} from "@/api/coupon.api";
import Modal from "@/components/ui/Modal";
import FormField, { inputClass } from "@/components/ui/FormField";
import { extractList } from "@/utils/extractList";
import { formatCurrency, formatDate } from "@/utils/format";

const EMPTY_FORM = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    startDate: "",
    endDate: "",
    isActive: true
};

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);
    const reload = () => setRefreshKey((key) => key + 1);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getCoupons();
                if (!cancelled) {
                    setCoupons(extractList(res?.data, ["coupons", "coupon"]));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load coupons");
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
    }, [refreshKey]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setIsModalOpen(true);
    };

    const openEdit = (coupon) => {
        setEditing(coupon);
        setForm({
            code: coupon.code || "",
            discountType: coupon.discountType || "PERCENTAGE",
            discountValue: coupon.discountValue ?? "",
            minOrderValue: coupon.minOrderValue ?? "",
            startDate: toDateInput(coupon.startDate),
            endDate: toDateInput(coupon.endDate),
            isActive: coupon.isActive ?? true
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!form.code.trim()) {
            setFormError("Coupon code is required");
            return;
        }

        if (!form.startDate || !form.endDate) {
            setFormError("Start and end dates are required");
            return;
        }

        setIsSaving(true);

        const payload = {
            code: form.code.trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue) || 0,
            minOrderValue: Number(form.minOrderValue) || 0,
            startDate: form.startDate,
            endDate: form.endDate,
            isActive: form.isActive
        };

        try {
            if (editing) {
                await updateCoupon(editing._id, payload);
            } else {
                await createCoupon(payload);
            }

            setIsModalOpen(false);
            reload();
        } catch (err) {
            setFormError(err.message || "Failed to save coupon");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (coupon) => {
        if (!window.confirm(`Delete coupon "${coupon.code}"?`)) {
            return;
        }

        try {
            await deleteCoupon(coupon._id);
            reload();
        } catch (err) {
            window.alert(err.message || "Failed to delete coupon");
        }
    };

    return (
        <div>
            <div className="mb-5 flex items-center justify-end">
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
                >
                    <Plus size={16} />
                    New coupon
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                                <th className="px-5 py-3">Code</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Value</th>
                                <th className="px-5 py-3">Min order</th>
                                <th className="px-5 py-3">Window</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && error && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !error && coupons.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                                        No coupons yet
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                !error &&
                                coupons.map((coupon) => (
                                    <tr
                                        key={coupon._id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-5 py-3 font-bold text-text">
                                            {coupon.code}
                                        </td>
                                        <td className="px-5 py-3 text-text-muted">
                                            {coupon.discountType}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-text">
                                            {coupon.discountType === "PERCENTAGE"
                                                ? `${coupon.discountValue}%`
                                                : formatCurrency(coupon.discountValue)}
                                        </td>
                                        <td className="px-5 py-3 text-text">
                                            {formatCurrency(coupon.minOrderValue)}
                                        </td>
                                        <td className="px-5 py-3 text-text-muted">
                                            {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(coupon)}
                                                    className="rounded-lg border border-border p-2 text-text-muted hover:text-text"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="rounded-lg border border-border p-2 text-text-muted hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <Modal
                    title={editing ? "Edit coupon" : "New coupon"}
                    onClose={() => setIsModalOpen(false)}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <FormField label="Code">
                            <input
                                className={inputClass}
                                value={form.code}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, code: e.target.value }))
                                }
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Type">
                                <select
                                    className={inputClass}
                                    value={form.discountType}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            discountType: e.target.value
                                        }))
                                    }
                                >
                                    <option value="PERCENTAGE">Percentage</option>
                                    <option value="FIXED">Fixed</option>
                                </select>
                            </FormField>

                            <FormField label="Value">
                                <input
                                    type="number"
                                    min="0"
                                    className={inputClass}
                                    value={form.discountValue}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            discountValue: e.target.value
                                        }))
                                    }
                                />
                            </FormField>
                        </div>

                        <FormField label="Min order value">
                            <input
                                type="number"
                                min="0"
                                className={inputClass}
                                value={form.minOrderValue}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        minOrderValue: e.target.value
                                    }))
                                }
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Start date">
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.startDate}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            startDate: e.target.value
                                        }))
                                    }
                                />
                            </FormField>

                            <FormField label="End date">
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.endDate}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            endDate: e.target.value
                                        }))
                                    }
                                />
                            </FormField>
                        </div>

                        <label className="flex items-center gap-2 text-sm font-medium text-text">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        isActive: e.target.checked
                                    }))
                                }
                            />
                            Active
                        </label>

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
                            {isSaving ? "Saving..." : "Save coupon"}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
