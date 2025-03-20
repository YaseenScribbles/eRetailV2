import { useForm } from "@inertiajs/react";
import { useEffect } from "react";

const MobileNav = ({ show, setShowMobileNav }) => {
    const { get, post, processing } = useForm();
    const logout = () => {
        post("/logout");
        localStorage.removeItem("eRetail_user");
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
                <div className="nav__item" onClick={() => get("/dashboard")}>
                    Dashboard
                </div>
                <div className="nav__item" onClick={() => get("/barcode")}>
                    Search
                </div>
                <div className="nav__item" onClick={() => get("/sales")}>
                    Sales
                </div>
                <div className="nav__item" onClick={() => get("/received")}>
                    Received
                </div>
                <div className="nav__item" onClick={() => get("/stock")}>
                    Stock
                </div>
                {JSON.parse(localStorage.getItem("eRetail_user"))
                    ?.has_invoice_report === "1" && (
                    <div className="nav__item" onClick={() => get("/invoice")}>
                        Invoice
                    </div>
                )}
                <div className="nav__item" onClick={() => get("/cvs")}>
                    CVS
                </div>
                {JSON.parse(localStorage.getItem("eRetail_user"))?.role ===
                    "admin" && (
                    <div className="nav__item" onClick={() => get("/sms")}>
                        SMS
                    </div>
                )}
                {JSON.parse(localStorage.getItem("eRetail_user"))?.role ===
                    "admin" && (
                    <div className="nav__item" onClick={() => get("/users")}>
                        Users
                    </div>
                )}
                <div className="nav__item" onClick={logout}>
                    Logout
                </div>
                <div
                    className="close-btn"
                    onClick={() => setShowMobileNav(false)}
                >
                    <svg className="close-icon">
                        <use xlinkHref="/images/sprite.svg#icon-cross"></use>
                    </svg>
                </div>
            </div>
        </>
    );
};

export default MobileNav;
