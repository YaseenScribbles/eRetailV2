import { router, usePage } from "@inertiajs/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, LogOut } from "lucide-react";
import getNavItems from "./navItems";

const COLLAPSE_KEY = "eRetail_sidebar_collapsed";
const WIDTH_EXPANDED = "25rem";
const WIDTH_COLLAPSED = "7rem";

const Navbar = () => {
    const { url } = usePage();
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem(COLLAPSE_KEY) === "1"
    );

    const logout = () => {
        router.post("/logout");
        localStorage.removeItem("eRetail_user");
    };

    useLayoutEffect(() => {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED
        );
        localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    }, [collapsed]);

    useEffect(() => {
        const checkUser = () => {
            const user = JSON.parse(localStorage.getItem("eRetail_user"));
            if (!user) {
                router.post("/logout");
            }
        };

        const timer = setTimeout(checkUser, 3000);
        return () => clearTimeout(timer); // Cleanup timeout
    }, []);

    return (
        <nav className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
            <button
                type="button"
                className="sidebar__toggle"
                onClick={() => setCollapsed((prev) => !prev)}
                title={collapsed ? "Expand" : "Collapse"}
            >
                {collapsed ? (
                    <ChevronRight className="sidebar__toggle-icon" />
                ) : (
                    <ChevronLeft className="sidebar__toggle-icon" />
                )}
            </button>
            <div
                className="sidebar__brand"
                onClick={() => router.get("/dashboard")}
            >
                <ShoppingBag className="sidebar__brand-icon" />
                <span className="sidebar__brand-name">eRetail</span>
            </div>
            <ul className="sidebar__list">
                {getNavItems().map((item) => (
                    <li className="sidebar__item" key={item.href}>
                        <a
                            href="#"
                            className={`sidebar__link ${
                                url === item.href
                                    ? "sidebar__link--active"
                                    : ""
                            }`}
                            title={item.label}
                            onClick={() => router.get(item.href)}
                        >
                            <item.icon className="sidebar__icon" />
                            <span>{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="sidebar__footer">
                <a
                    href="#"
                    className="sidebar__link sidebar__link--logout"
                    title="Logout"
                    onClick={logout}
                >
                    <LogOut className="sidebar__icon" />
                    <span>Logout</span>
                </a>
            </div>
        </nav>
    );
};

export default Navbar;
