"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import NotificationPanel from "@/components/admin/NotificationPanel";
import { useAuthStore, ADMIN_ROLES } from "@/store/useAuthStore";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const { user, token, hasHydrated } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAuthorized = token && user && ADMIN_ROLES.includes(user.role);

    useEffect(() => {
        if (hasHydrated && !isAuthorized) {
            router.replace("/");
        }
    }, [hasHydrated, isAuthorized, router]);

    if (!hasHydrated || !isAuthorized) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-bg">
                <Loader2 className="animate-spin text-primary" size={28} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-bg">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-h-screen flex-1 flex-col">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
            </div>

            <NotificationPanel />
        </div>
    );
}
