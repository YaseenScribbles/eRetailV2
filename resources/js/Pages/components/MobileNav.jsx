import { useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { ShoppingBag, LogOut, X } from "lucide-react";
import getNavItems from "./navItems";

const MobileNav = ({ show, setShowMobileNav }) => {
    const { url } = usePage();
    const { get, post, processing } = useForm();

    const logout = () => {
        post("/logout");
        localStorage.removeItem("eRetail_user");
    };

    const navigate = (href) => {
        get(href);
        setShowMobileNav(false);
    };

    useEffect(() => {
        const checkUser = () => {
            const user = JSON.parse(localStorage.getItem("eRetail_user"));
            if (!user) {
                post("/logout");
            }
        };

        const timer = setTimeout(checkUser, 3000);
        return () => clearTimeout(timer); // Cleanup timeout
    }, []);

    return (
        <>
            <div className={`mobile-nav ${show ? "show" : ""}`}>
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="mobile-nav__brand">
                    <ShoppingBag className="mobile-nav__brand-icon" />
                    <span>eRetail</span>
                </div>
                <div className="mobile-nav__list">
                    {getNavItems().map((item) => (
                        <div
                            key={item.href}
                            className={`nav__item ${
                                url === item.href ? "nav__item--active" : ""
                            }`}
                            onClick={() => navigate(item.href)}
                        >
                            <item.icon className="mobile-nav__item-icon" />
                            <span>{item.label}</span>
                        </div>
                    ))}
                    <div
                        className="nav__item nav__item--logout"
                        onClick={logout}
                    >
                        <LogOut className="mobile-nav__item-icon" />
                        <span>Logout</span>
                    </div>
                </div>
                <div
                    className="close-btn"
                    onClick={() => setShowMobileNav(false)}
                >
                    <X className="close-icon" />
                </div>
            </div>
        </>
    );
};

export default MobileNav;
