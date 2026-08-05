import "./bootstrap";

import { createInertiaApp, router } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import "../css/app.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Expired session (419) is handled server-side (redirects to login with a
// message). This is the fallback for any other non-Inertia response — 500s,
// 403s, etc. — which would otherwise dump raw error HTML into the SPA.
router.on("invalid", (event) => {
    event.preventDefault();
    alert("Something went wrong. The page will now reload.");
    window.location.reload();
});

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <QueryClientProvider client={queryClient}>
                <App {...props} />
            </QueryClientProvider>
        );
    },
});
