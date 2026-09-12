"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";

import { getProducts, getProductById, deleteProduct } from "@/api/product.api";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import DetailsTab from "@/components/admin/product-tabs/DetailsTab";
import MediaTab from "@/components/admin/product-tabs/MediaTab";
import SpecsTab from "@/components/admin/product-tabs/SpecsTab";
import OptionsTab from "@/components/admin/product-tabs/OptionsTab";
import PriceSlabsTab from "@/components/admin/product-tabs/PriceSlabsTab";
import ShippingTab from "@/components/admin/product-tabs/ShippingTab";
import { extractList } from "@/utils/extractList";
import { formatCurrency } from "@/utils/format";

const TABS = ["Details", "Media", "Specs", "Options & values", "Price slabs", "Shipping"];
const PAGE_SIZE = 8;

const STATUS_TONE = {
    PUBLISHED: "success",
    DRAFT: "neutral",
    ARCHIVED: "danger"
};

export default function ProductsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [page, setPage] = useState(1);

    const [refreshKey, setRefreshKey] = useState(0);
    const reload = () => setRefreshKey((key) => key + 1);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError("");

            try {
                const res = await getProducts({ page, limit: PAGE_SIZE });
                if (!cancelled) {
                    setProducts(extractList(res?.data, ["products", "product"]));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to load products");
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
        const openFromLink = async () => {
            const id = searchParams.get("id");
            if (!id) {
                return;
            }

            try {
                const res = await getProductById(id);
                const product = res?.data?.product || res?.data;
                if (product) {
                    setEditingProduct(product);
                    setIsModalOpen(true);
                }
            } finally {
                router.replace("/dashboard/products");
            }
        };

        openFromLink();
    }, [searchParams, router]);

    const openCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete product "${product.name}"?`)) return;

        try {
            await deleteProduct(product._id);
            reload();
        } catch (err) {
            window.alert(err.message || "Failed to delete product");
        }
    };

    const categoryName = (product) =>
        typeof product.category === "object" ? product.category?.name : "—";

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-text hover:bg-bg">
                        Sample .xlsx
                    </button>
                    <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-text hover:bg-bg">
                        Bulk import
                    </button>
                </div>

                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
                >
                    <Plus size={16} />
                    New product
                </button>
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

            {!isLoading && !error && products.length === 0 && (
                <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-text-muted">
                    No products yet
                </div>
            )}

            {!isLoading && !error && products.length > 0 && (
                <>
                    {/* Mobile: one card per product */}
                    <div className="space-y-3 md:hidden">
                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="rounded-2xl border border-border bg-card p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-text">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-text-muted">{product.sku}</p>
                                    </div>
                                    <Badge tone={STATUS_TONE[product.status] || "neutral"}>
                                        {product.status}
                                    </Badge>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-text-muted">
                                            Price
                                        </p>
                                        <p className="font-semibold text-text">
                                            {formatCurrency(product.basePrice)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase text-text-muted">
                                            Category
                                        </p>
                                        <p className="text-text-muted">{categoryName(product)}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                                    <button
                                        onClick={() => openEdit(product)}
                                        title="View"
                                        className="rounded-lg border border-border p-2 text-text-muted hover:text-text"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() => openEdit(product)}
                                        title="Edit"
                                        className="rounded-lg border border-border p-2 text-text-muted hover:text-text"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        title="Delete"
                                        className="rounded-lg border border-border p-2 text-text-muted hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
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
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">Price</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-5 py-3 font-semibold text-text">
                                                {product.name}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {product.sku}
                                            </td>
                                            <td className="px-5 py-3 text-text">
                                                {formatCurrency(product.basePrice)}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {categoryName(product)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Badge tone={STATUS_TONE[product.status] || "neutral"}>
                                                    {product.status}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(product)}
                                                        title="View"
                                                        className="rounded-lg border border-border p-2 text-text-muted hover:text-text"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(product)}
                                                        title="Edit"
                                                        className="rounded-lg border border-border p-2 text-text-muted hover:text-text"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product)}
                                                        title="Delete"
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
                </>
            )}

            {!isLoading && !error && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3">
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
                            disabled={products.length < PAGE_SIZE}
                            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-text disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => {
                        setIsModalOpen(false);
                        reload();
                    }}
                />
            )}
        </div>
    );
}

function ProductModal({ product: initialProduct, onClose }) {
    const [product, setProduct] = useState(initialProduct);
    const [tab, setTab] = useState("Details");

    return (
        <Modal
            title={product ? "Edit product" : "New product"}
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4">
                {TABS.map((item) => {
                    const disabled = item !== "Details" && !product;

                    return (
                        <button
                            key={item}
                            disabled={disabled}
                            onClick={() => setTab(item)}
                            className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                tab === item
                                    ? "bg-primary text-white"
                                    : "bg-bg text-text-muted hover:text-text"
                            }`}
                        >
                            {item}
                        </button>
                    );
                })}
            </div>

            {tab === "Details" && (
                <DetailsTab
                    product={product}
                    onSaved={(saved) => {
                        setProduct(saved);
                        if (!initialProduct) {
                            setTab("Media");
                        }
                    }}
                />
            )}

            {tab === "Media" && product && <MediaTab productId={product._id} />}
            {tab === "Specs" && product && <SpecsTab productId={product._id} />}
            {tab === "Options & values" && product && (
                <OptionsTab productId={product._id} />
            )}
            {tab === "Price slabs" && product && (
                <PriceSlabsTab productId={product._id} />
            )}
            {tab === "Shipping" && product && <ShippingTab productId={product._id} />}

            <div className="mt-5 border-t border-border pt-4">
                <button
                    onClick={onClose}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-bg"
                >
                    Done
                </button>
            </div>
        </Modal>
    );
}
