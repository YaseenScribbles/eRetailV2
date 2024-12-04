import { router, usePage } from "@inertiajs/react";
import { useEffect } from "react";

const Navbar = () => {
    const { url } = usePage();
    const logout = () => {
        router.post("/logout");
        localStorage.removeItem("eRetail_user");
    };

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
        <nav className="nav">
            <div className="app-title" onClick={() => router.get("/dashboard")}>
                <svg className="logo__icon">
                    <use xlinkHref="/images/sprite.svg#icon-shopping-bag"></use>
                </svg>
                <h1 className="app-name">eRetail</h1>
            </div>
            <ul className="nav__list">
                <li className="nav__item">
                    <a
                        href="#"
                        className={`nav__link ${
                            url == "/barcode" ? "nav__link--active" : ""
                        }`}
                        onClick={() => router.get("/barcode")}
                    >
                        Search
                    </a>
                </li>
                <li className="nav__item">
                    <a
                        href="#"
                        className={`nav__link ${
                            url == "/sales" ? "nav__link--active" : ""
                        }`}
                        onClick={() => router.get("/sales")}
                    >
                        Sales
                    </a>
                </li>
                <li className="nav__item">
                    <a
                        href="#"
                        className={`nav__link ${
                            url == "/received" ? "nav__link--active" : ""
                        }`}
                        onClick={() => router.get("/received")}
                    >
                        Received
                    </a>
                </li>
                <li className="nav__item">
                    <a
                        href="#"
                        className={`nav__link ${
                            url == "/stock" ? "nav__link--active" : ""
                        }`}
                        onClick={() => router.get("/stock")}
                    >
                        Stock
                    </a>
                </li>
                {JSON.parse(localStorage.getItem("eRetail_user"))
                    ?.has_invoice_report === "1" && (
                    <li className="nav__item">
                        <a
                            href="#"
                            className={`nav__link ${
                                url == "/invoice" ? "nav__link--active" : ""
                            }`}
                            onClick={() => router.get("/invoice")}
                        >
                            Invoice
                        </a>
                    </li>
                )}
                <li className="nav__item">
                    <a
                        href="#"
                        className={`nav__link ${
                            url == "/cvs" ? "nav__link--active" : ""
                        }`}
                        onClick={() => router.get("/cvs")}
                    >
                        CVS
                    </a>
                </li>
                {JSON.parse(localStorage.getItem("eRetail_user"))?.role ===
                    "admin" && (
                    <li className="nav__item">
                        <a
                            href="#"
                            className={`nav__link ${
                                url == "/users" ? "nav__link--active" : ""
                            }`}
                            onClick={() => router.get("/users")}
                        >
                            Users
                        </a>
                    </li>
                )}
                <li className="nav__item">
                    <a href="#" className="nav__link" onClick={logout}>
                        <svg className="logout__icon">
                            <use xlinkHref="/images/sprite.svg#icon-log-out"></use>
                        </svg>
                        Logout
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
