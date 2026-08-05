# eRetail

A Laravel + Inertia.js + React reporting app for retail operations (sales, stock, received goods, invoices, CVS, offers, SMS campaigns, user management).

## Stack

- **Backend**: Laravel 10, Inertia.js server adapter
- **Frontend**: React 18 via Inertia, no Blade views except the Inertia shell (`resources/views/app.blade.php`)
- **Build**: Vite (`resources/js/app.jsx` entry) + a separate Sass pipeline (`resources/js/Pages/main.scss` → `resources/css/app.css`, **not** run through Vite)
- **Data/tables**: `@tanstack/react-table` + `@tanstack/react-query`, `react-select`, `react-date-range`, `recharts`, `xlsx` for export
- **Styling**: hand-written SCSS, no Tailwind/Bootstrap/component library. All shared classes live in `resources/js/Pages/sass/_components.scss`; per-page partials in the same folder (`_sales.scss`, `_dashboard.scss`, etc.)

## Commands

```
npm run dev          # Vite dev server (bound to 192.168.10.65)
npm run watch:sass    # Sass watcher — required alongside dev, CSS is not built by Vite
npm run build         # production Vite build
npm run start          # php artisan serve + dev + watch:sass together
```

When editing SCSS only (no JSX changes), compile with:
```
npx sass resources/js/Pages/main.scss resources/css/app.css
```

## Frontend architecture notes

- No shared layout component. Every top-level page (`resources/js/Pages/*.jsx`) renders `<Navbar />` (the sidebar) + a floating `.mobile-nav__btn` + `<MobileNav />` itself, then its own content. `Login.jsx` is the only page without this.
- `resources/js/Pages/components/navItems.js` is the single source of truth for the nav menu (label/route/icon/visibility) — both `Navbar.jsx` (desktop sidebar) and `MobileNav.jsx` (mobile drawer) read from it. Don't hardcode menu items in either component again.
- Desktop nav is a collapsible left sidebar (`.sidebar`), persisted via `localStorage` (`eRetail_sidebar_collapsed`) and driven by a CSS custom property (`--sidebar-width`) set on `<html>` from `Navbar.jsx`. Page content offset (`.page`, `.grid-container`, `.p-s-g`) reads that same variable via `calc(var(--sidebar-width, ...) + Xrem)`, so collapse/expand resizes content without touching any page file.
- Below `$mobile-breakpoint` (37.5em), the sidebar is `display: none` entirely — mobile relies solely on the floating hamburger button + full-screen `MobileNav` drawer.
- Shared design tokens (radii, shadows, transitions, sidebar/caption colors, the `premium-input`/`premium-select` mixins) live in `resources/js/Pages/sass/_variables.scss`. Reuse these rather than hand-rolling new shadow/radius values.
- `$color-primary` (`#638663`) is the brand color — treat as fixed unless explicitly told otherwise. Backgrounds, tints, and derived shades are fair game.

## Changelog

### v1.3.1 — Dashboard grid cells no longer stretch to tallest sibling (2026-08-05)

`.grid-container .cell` (`_dashboard.scss`) had both `min-height: 20rem` (a floor, from v1.1.0, so sparse cards don't look broken) **and** `height: 100%`. The parent grid's `align-items: start` should let cards size to their own content, but `height: 100%` on the child overrides that and forces every card in a row to stretch to match the *tallest* sibling's `min-content` row-track height — e.g. a 6-row Sales table stretching to match a 10-row Sold Products table in the same row, leaving a big dead-space gap under its own content. Removed `height: 100%`; `min-height: 20rem` alone still does its job (short cards get a floor) without forcing short cards to match tall ones.

Also added `border-right` between `.dashboard-table th` header cells (Dashboard page only), matching the column-divider style `_productsearch.scss` already uses — the shared `.table` (Grid.jsx, used by Sales/Stock/Received/Users/SMS/Offer/Invoice/CvS) deliberately still has no column dividers, left as-is per explicit choice.

That border-right change surfaced a pre-existing bug: `.dashboard-table` never declared `border-collapse`, so it fell back to the browser default (`separate`, ~2px `border-spacing`). That inter-cell spacing sits outside each sticky `th`'s own box, so on scroll it doesn't move with the header — body rows slide underneath while the gap itself stays put, showing as white slivers behind/between header cells (worse once the new border-right made the seam more visible). Added `border-collapse: collapse` to `.dashboard-table`, matching `_productsearch.scss`'s tables — same `position: sticky`-on-cells pattern already works correctly there with `collapse`, so this isn't new territory for this codebase.

### v1.3.0 — Icon system: sprite.svg → lucide-react (2026-08-05)

Replaced the hand-rolled `public/images/sprite.svg` `<use>`-based icon system with [`lucide-react`](https://lucide.dev) across the whole app — nav, buttons, tables, modals, pagination (~50 usage sites across every page plus `Navbar`/`MobileNav`/`Grid`/`Toast`/`SmsModal`/`navItems.js`).

- `navItems.js` now exports actual Lucide component references (`icon: Home`) instead of sprite id strings (`icon: "icon-home"`) — `Navbar.jsx`/`MobileNav.jsx` render them as `<item.icon className="..." />`. If you add a nav item, import the component and assign it directly, no string lookup involved.
- Every `<svg className="X"><use xlinkHref=".../sprite.svg#icon-Y" /></svg>` became `<LucideComponent className="X" />` — same `className`-driven sizing as before, so no SCSS restructuring was needed beyond one thing below.
- **`fill:` → `stroke:`**: the old sprite icons were fill-based; Lucide icons are stroke-based (`fill="none" stroke="currentColor"` by default) and CSS `fill`/`stroke` on the class override those SVG presentation attributes independently. Every icon-related SCSS rule that declared `fill: currentColor` / `fill: $color-white` / `fill: $color-primary` (~19 rules across `_components.scss`, `_productsearch.scss`, `_users.scss`) was changed to the `stroke:` equivalent — leaving `fill:` in place would have rendered icons as solid-filled shapes instead of clean outlines. If you add a new icon-holding class, it needs `stroke:` (not `fill:`) to control its color.
- `.search-icon` in `_productsearch.scss` was left untouched — confirmed unused (no JSX references it), predates this change.
- `public/images/sprite.svg` itself was **not** deleted — no remaining references in app code (one dead, commented-out block in `Received.jsx` still mentions it, functionally inert), but the file was left in place rather than removed as part of this pass.

### v1.2.0 — Barcode/product-search report overhaul (2026-08-05)

Reworked the Location Report on the Barcode page (`Barcode.jsx` + `BarcodeController.php`) for product-level detail without a wall of rows, plus a large backend performance pass on the same page.

**Location Report**
- Rows now group by **shop** (matching the report's location-first purpose), each showing aggregated Sales Qty/Amount/Stock; clicking a shop expands it into a **per-product** breakdown scoped to that shop (`location-report__group-row` / `location-report__product-row` in `_productsearch.scss`). Product Summary already covers cross-shop product totals, so this is what differentiates the two reports instead of duplicating it.
- `Days Since First Delivery` only shows at the expanded product level, not the shop-level aggregate row (a single shop-level number was ambiguous when multiple products/deliveries were involved).
- That figure is sourced from `ReceivedMaster`/`ReceivedDetails` (first time a given `PluID` was received at a given shop) — not `DeliveryDetails`/`DeliveryMaster` (inter-shop transfers), which was the original but incorrect source.
- Removed the standalone Stock and Sales tables (`p-s-g__3`/`p-s-g__4`) — superseded by Location Report + Product Summary; kept `getStock`/`getSales` deleted rather than left unused.
- Delivery ("Transaction Logs") is now opt-in via an unchecked-by-default checkbox in the search form (`include_delivery` on the Inertia form) — it's a ~2s query that most searches don't need. Note: `useForm`'s `setData(obj)` **replaces** the whole data object rather than merging, so every existing `setData({...})` call in this file had to be switched to the functional-updater form (`setData(prev => ({...prev, ...}))`) to avoid silently dropping this field.

**Backend performance** (`BarcodeController.php`)
- `getLocationReport`/`getProductSummary` used to run **6 separate queries** (3 each, re-querying `v_stockpos`/`BillDetails` independently) per search. Replaced with one `getProductSearchData` query + two pure-PHP aggregators (`buildLocationReport`, `buildProductSummary`) that reuse the same result set — one DB round trip instead of six.
- That single query is a CTE chain (`FilteredProducts` → `PurchaseData`/`SalesData`/`StockData`/`ReceivedData`) with the product/shop filter applied in `FilteredProducts` and joined into every other CTE **before** aggregation — a plain SQL view can't do this (no parameters, so its CTEs had to fully aggregate every product before the outer `WHERE` filtered it down, same cost regardless of how few products were selected).
- Purchase qty from `GRNDetails` is location-agnostic but ends up repeated once per shop a `PluID` was received at (through the join to `ReceivedData`) — `buildProductSummary` dedupes by `PluID` before summing to avoid overcounting.
- Added `getActiveShopIds()` — intersects the user's assigned shops with `ShopSettings.Active = 1`, used by both `getDelivery` and `getProductSearchData`. A shop missing from `ShopSettings` entirely is excluded (same as inactive), by design.
- Root cause of the remaining ~5-6s floor: `v_stockpos` sits on `v_currentstockpos`, which recomputes current stock from a live `UNION ALL` across 11 historical-ledger tables (deliveries, receipts, sales, stock takes, purchase returns, GRN, audits, DC/RC vouchers) — no materialized running balance. 4 of those tables (`StockAlterDetails`, `StockAuditDetails`, `DCDet`, `RCDet`) have **no indexes at all**. `CREATE INDEX` statements were drafted (`PluID`-leading, covering the columns the view reads) but **not yet applied** — pending the user running them on production.

**Known follow-ups / things to watch**
- `BarcodeController::timedSelect()` (query-level timing → `Log::info`, tagged `[BarcodeReport timing]`) is temporary diagnostic instrumentation, explicitly commented as such — remove once the `v_stockpos` indexing question is settled.
- Even after those indexes land, `v_currentstockpos`'s full-ledger-recomputation design is the structural ceiling here — a maintained running-balance table (updated incrementally rather than recomputed from full history every read) is the real fix if this needs to get faster still.
- `V_ProductSearch` (a DB view the user created mid-investigation, same shape as the `getProductSearchData` CTE chain) is **not** used by the app — a plain view can't accept the per-search product filter, so the equivalent CTEs were inlined directly in `getProductSearchData` instead. The view may still exist in the DB for ad hoc use.

### v1.1.0 — UI revamp (2026-08-04)

Full visual overhaul of the app shell and every report/grid page. Primary color unchanged throughout.

**Navigation**
- Replaced the fixed top navbar with a collapsible left sidebar (icon+label links, active-state highlight, logout pinned to the bottom).
- Mobile drawer (`MobileNav`) rebuilt to match: branding header, icons per item, staggered slide-in, auto-closes on navigation.
- Removed the old mobile-only top bar (previously just the logo, wasting vertical space) — mobile now navigates purely via the floating action button + drawer.
- `navItems.js` extracted as the single source of truth for both nav surfaces (previously hand-duplicated and could drift).

**Typography & color**
- Swapped Agdasima/Open Sans for **Sora** (brand wordmark) + **Inter** (everything else).
- Introduced a layered surface system: soft tinted page canvas (`$color-page-bg`) behind white, shadowed cards — instead of one flat background color everywhere.
- Table/card "title" bars (captions) standardized to one soft green tint (`$color-caption-bg`/`$color-caption-text`) instead of each section (caption/header/footer/empty-space) using a different shade.

**Grids & tables**
- Dashboard and Search-page grids fixed to stop leaving dead space on the sides when few cards render (`auto-fit, minmax(50rem, 1fr)` instead of a fixed max width) — mobile gets an explicit single-column override.
- Delivery table (6 columns) given the full grid row instead of being squeezed into a shared column with narrower tables.
- Table captions are sticky + centered; column headers and footer totals are sticky too (pinned via cell-level `position: sticky`, not on `thead`/`tfoot` directly — that pattern has patchy browser support).
- Row borders + hover highlight standardized across all table types (previously only the main `.table` had them).
- Cards get a `min-height` floor so sparse tables (1-2 rows) don't look visually broken next to fuller siblings in the same grid row.

**Forms & inputs**
- `premium-input`/`premium-select` mixins (`_variables.scss`) give every input/select a consistent border, shadow, focus ring, and size — replaces ~5 duplicated ad-hoc input styles across page partials.
- `react-select` now matches the app's font/colors/shadows (menu, options, placeholder, indicators) via the same mixin, instead of the library's own defaults. The inline `theme` prop passed to every `ReactSelect` instance now uses a graduated tint scale for hover/active/selected instead of one flat color for all three.
- Placeholder text standardized to gray (`#999`) instead of a green-tinted color.
- Date-range picker popup: forced to the app font, anchored `right: 0` (not `left: 0`) so it doesn't overflow off-screen when its trigger sits mid-row, capped `max-width` to the viewport as a fallback, and hides its "defined ranges" sidebar starting at a much wider breakpoint.

**Buttons**
- Every `.btn` now supports icon + text via a `.btn__icon` child and flex layout — applied where context allows (Go/Send/Test/Save buttons); stayed icon-only where space is tight and repeated (pagination, row actions, download/edit).
- Row action icons (date/payment/delete) restyled as real icon buttons with hover backgrounds and tooltips.
- "Range picker" buttons (Sales, CvS, Invoice, Received) now show the actual selected date range instead of static text.

**Known follow-ups / things to watch**
- The `.page__form .btn { width: auto }` change (for the date-range button) needed an explicit mobile override back to `width: 100%` — if new buttons are added inside `.page__form`, check they still stack full-width on mobile.
- `react-date-range`'s popup positioning is a CSS-only heuristic (`right: 0` anchor + viewport-capped max-width), not measured — a trigger button placed very close to the left edge of a narrow viewport could still overflow left. Not currently an issue with existing page layouts.
- Barcode/Search page's own toolbar (`.p-s-g__form`) uses `flex-basis` percentages for button sizing rather than `width`, so it wasn't affected by the above but also doesn't share the same sizing system — worth reconciling if that page gets more form controls.
