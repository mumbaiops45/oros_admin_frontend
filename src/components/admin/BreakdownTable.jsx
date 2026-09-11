"use client";

import { useState } from "react";

import { formatCurrency } from "@/utils/format";
import Pager from "@/components/admin/Pager";

const PAGE_SIZE = 8;

export default function BreakdownTable({ title, rows = [], isLoading }) {
    const [page, setPage] = useState(1);
    const [prevRows, setPrevRows] = useState(rows);

    if (rows !== prevRows) {
        setPrevRows(rows);
        setPage(1);
    }

    const totalRevenue = rows.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                {title}
            </h3>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                                <th className="px-5 py-3"></th>
                                <th className="px-5 py-3">Orders</th>
                                <th className="px-5 py-3">Revenue</th>
                                <th className="px-5 py-3">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-8 text-center text-text-muted"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-8 text-center text-text-muted"
                                    >
                                        No data in this range
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                pageRows.map((row) => {
                                    const sharePercent =
                                        row.sharePercent ??
                                        (totalRevenue > 0
                                            ? (row.revenue / totalRevenue) * 100
                                            : 0);

                                    return (
                                        <tr
                                            key={row.key}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-5 py-3 font-bold uppercase text-text">
                                                {row.key}
                                            </td>
                                            <td className="px-5 py-3 text-text">
                                                {row.orders}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-text">
                                                {formatCurrency(row.revenue)}
                                            </td>
                                            <td className="px-5 py-3 text-text-muted">
                                                {sharePercent.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {!isLoading && rows.length > PAGE_SIZE && (
                    <Pager
                        page={page}
                        hasNext={page * PAGE_SIZE < rows.length}
                        onPrev={() => setPage((p) => Math.max(1, p - 1))}
                        onNext={() => setPage((p) => p + 1)}
                    />
                )}
            </div>
        </div>
    );
}
