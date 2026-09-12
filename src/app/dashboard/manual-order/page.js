"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { getUsers, createUser } from "@/api/user.api";
import { getProducts } from "@/api/product.api";
import { createManualOrder } from "@/api/order.api";
import Modal from "@/components/ui/Modal";
import FormField, { inputClass } from "@/components/ui/FormField";
import { extractList } from "@/utils/extractList";

const PAYMENT_METHODS = ["Cash", "UPI", "Card"];

export default function ManualOrderPage() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [customerId, setCustomerId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [items, setItems] = useState([{ productId: "", qty: 1 }]);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [customerError, setCustomerError] = useState("");

    const loadOptions = async () => {
        try {
            const [userRes, productRes] = await Promise.all([
                getUsers({ limit: 1000 }),
                getProducts({ limit: 500 })
            ]);

            setCustomers(extractList(userRes?.data, ["users", "user"]));
            setProducts(extractList(productRes?.data, ["products", "product"]));
        } catch (err) {
            setError(err.message || "Failed to load customers/products");
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [userRes, productRes] = await Promise.all([
                    getUsers(),
                    getProducts({ limit: 500 })
                ]);

                if (!cancelled) {
                    setCustomers(extractList(userRes?.data, ["users", "user"]));
                    setProducts(
                        extractList(productRes?.data, ["products", "product"])
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load customers/products");
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const updateItem = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const addLine = () => {
        setItems((prev) => [...prev, { productId: "", qty: 1 }]);
    };

    const removeLine = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreateCustomer = async (event) => {
        event.preventDefault();
        setCustomerError("");

        if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
            setCustomerError("Name, phone and email are required");
            return;
        }

        setIsCreatingCustomer(true);

        try {
            const res = await createUser(newCustomer);
            const user = res?.data?.user;

            await loadOptions();

            if (user?._id) {
                setCustomerId(user._id);
            }

            setIsNewCustomerOpen(false);
            setNewCustomer({ name: "", phone: "", email: "" });
        } catch (err) {
            setCustomerError(err.message || "Failed to create customer");
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const validItems = items.filter((item) => item.productId && item.qty > 0);

        if (!customerId) {
            setError("Select a customer");
            return;
        }

        if (validItems.length === 0) {
            setError("Add at least one item");
            return;
        }

        setIsSubmitting(true);

        try {
            await createManualOrder({
                customerId,
                paymentMethod,
                items: validItems.map((item) => ({
                    productId: item.productId,
                    qty: Number(item.qty)
                })),
                note
            });

            router.push("/dashboard/orders");
        } catch (err) {
            setError(err.message || "Failed to create order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
                <FormField label="Customer">
                    <select
                        className={inputClass}
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                    >
                        <option value="">Select...</option>
                        {customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                                {customer.name} · {customer.phone}
                            </option>
                        ))}
                    </select>
                </FormField>

                <button
                    type="button"
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="text-sm font-semibold text-accent hover:text-accent-dark"
                >
                    + New customer
                </button>

                <FormField label="Payment method">
                    <select
                        className={inputClass}
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                                {method}
                            </option>
                        ))}
                    </select>
                </FormField>

                <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
                        Items
                    </p>

                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-wrap items-center gap-2">
                                <select
                                    className={`${inputClass} min-w-0 flex-1`}
                                    value={item.productId}
                                    onChange={(e) =>
                                        updateItem(index, "productId", e.target.value)
                                    }
                                >
                                    <option value="">Select product...</option>
                                    {products.map((product) => (
                                        <option key={product._id} value={product._id}>
                                            {product.name} ({product.sku})
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) =>
                                        updateItem(index, "qty", e.target.value)
                                    }
                                    className={`${inputClass} w-20`}
                                />

                                <button
                                    type="button"
                                    onClick={() => removeLine(index)}
                                    className="rounded-lg border border-border p-2 text-text-muted hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addLine}
                        className="mt-2 text-sm font-semibold text-accent hover:text-accent-dark"
                    >
                        + Add line
                    </button>
                </div>

                <FormField label="Note">
                    <textarea
                        className={`${inputClass} min-h-20 resize-y`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </FormField>

                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
                >
                    {isSubmitting ? "Creating..." : "Create order"}
                </button>
            </form>

            {isNewCustomerOpen && (
                <Modal title="New customer" onClose={() => setIsNewCustomerOpen(false)}>
                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                        <FormField label="Name">
                            <input
                                className={inputClass}
                                value={newCustomer.name}
                                onChange={(e) =>
                                    setNewCustomer((prev) => ({
                                        ...prev,
                                        name: e.target.value
                                    }))
                                }
                            />
                        </FormField>

                        <FormField label="Phone">
                            <input
                                className={inputClass}
                                value={newCustomer.phone}
                                onChange={(e) =>
                                    setNewCustomer((prev) => ({
                                        ...prev,
                                        phone: e.target.value
                                    }))
                                }
                            />
                        </FormField>

                        <FormField label="Email">
                            <input
                                type="email"
                                className={inputClass}
                                value={newCustomer.email}
                                onChange={(e) =>
                                    setNewCustomer((prev) => ({
                                        ...prev,
                                        email: e.target.value
                                    }))
                                }
                            />
                        </FormField>

                        {customerError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                {customerError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isCreatingCustomer}
                            className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70"
                        >
                            {isCreatingCustomer ? "Creating..." : "Create customer"}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
