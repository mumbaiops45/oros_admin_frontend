import {
    LayoutDashboard,
    Package,
    FileText,
    CreditCard,
    Box,
    LayoutGrid,
    Layers,
    ShoppingCart,
    Tag,
    Users,
    PlusSquare,
    Image
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/dashboard/orders", icon: Package },
    { label: "Quotations", href: "/dashboard/quotations", icon: FileText },
    { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { label: "Products", href: "/dashboard/products", icon: Box },
    { label: "Categories", href: "/dashboard/categories", icon: LayoutGrid },
    { label: "Subcategories", href: "/dashboard/subcategories", icon: Layers },
    { label: "Abandoned carts", href: "/dashboard/abandoned-carts", icon: ShoppingCart },
    { label: "Coupons", href: "/dashboard/coupons", icon: Tag },
    { label: "Users", href: "/dashboard/users", icon: Users },
    { label: "Manual order", href: "/dashboard/manual-order", icon: PlusSquare },
    { label: "Banners", href: "/dashboard/banners", icon: Image }
];
