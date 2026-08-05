// Single source of truth for the sidebar (desktop) and mobile drawer menus,
// so the two never drift out of sync with each other.
import {
    Home,
    Search,
    ShoppingCart,
    ArrowDownToLine,
    List,
    IndianRupee,
    ArrowLeftRight,
    Megaphone,
    MessageCircle,
    KeyRound,
} from "lucide-react";

const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem("eRetail_user"));
    } catch {
        return null;
    }
};

export const getNavItems = () => {
    const user = getUser();

    return [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/barcode", label: "Search", icon: Search },
        { href: "/sales", label: "Sales", icon: ShoppingCart },
        { href: "/received", label: "Received", icon: ArrowDownToLine },
        { href: "/stock", label: "Stock", icon: List },
        {
            href: "/invoice",
            label: "Invoice",
            icon: IndianRupee,
            show: user?.has_invoice_report === "1",
        },
        { href: "/cvs", label: "CVS", icon: ArrowLeftRight },
        { href: "/offer", label: "Offer", icon: Megaphone },
        {
            href: "/sms",
            label: "SMS",
            icon: MessageCircle,
            show: user?.role === "admin",
        },
        {
            href: "/users",
            label: "Users",
            icon: KeyRound,
            show: user?.role === "admin",
        },
    ].filter((item) => item.show !== false);
};

export default getNavItems;
