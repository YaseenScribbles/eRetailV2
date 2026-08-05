import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import { useForm } from "@inertiajs/react";
import Toast from "./components/Toast";
import ReactSelect, { components } from "react-select";
import Scanner from "./components/Scanner";
import { Menu, Check, ScanLine, ChevronDown, ChevronRight } from "lucide-react";

const SELECT_ALL_VALUE = "__select_all__";
const MAX_VISIBLE_CHIPS = 3;

const CollapsedMultiValue = (props) => {
    const { index, getValue } = props;
    const total = getValue().length;
    if (index < MAX_VISIBLE_CHIPS) {
        return <components.MultiValue {...props} />;
    }
    if (index === MAX_VISIBLE_CHIPS) {
        return (
            <div className="select__overflow-badge">
                +{total - MAX_VISIBLE_CHIPS} more
            </div>
        );
    }
    return null;
};

const Barcode = (props) => {
    const [showMobileNav, setShowMobileNav] = useState(false);
    const { post, processing, data, setData } = useForm({
        barcode: "",
        product_ids: [],
        include_delivery: false,
    });
    const [summary, setSummary] = useState();
    const [delivery, setDelivery] = useState([]);
    const [locationReport, setLocationReport] = useState([]);
    const [expandedLocationShops, setExpandedLocationProducts] = useState(
        new Set()
    );
    const [productSummary, setProductSummary] = useState([]);
    const [errors, setErrors] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productInput, setProductInput] = useState("");
    const [barcode, setBarcode] = useState("");
    const [showScanner, setShowScanner] = useState(false);

    const filteredProductOptions = useMemo(() => {
        const query = productInput.trim().toLowerCase();
        const matches = query
            ? products.filter((p) => p.label.toLowerCase().includes(query))
            : products;
        if (matches.length === 0) return matches;
        return [
            { label: `Select All (${matches.length})`, value: SELECT_ALL_VALUE },
            ...matches,
        ];
    }, [products, productInput]);

    const locationReportGrouped = useMemo(() => {
        const groups = new Map();
        for (const row of locationReport) {
            if (!groups.has(row.ShopName)) {
                groups.set(row.ShopName, {
                    ShopName: row.ShopName,
                    SalesQty: 0,
                    SalesAmount: 0,
                    Stock: 0,
                    products: [],
                });
            }
            const group = groups.get(row.ShopName);
            group.SalesQty += +row.SalesQty;
            group.SalesAmount += +row.SalesAmount;
            group.Stock += +row.Stock;
            group.products.push(row);
        }
        return Array.from(groups.values());
    }, [locationReport]);

    const toggleLocationShop = (shopName) => {
        setExpandedLocationProducts((prev) => {
            const next = new Set(prev);
            if (next.has(shopName)) {
                next.delete(shopName);
            } else {
                next.add(shopName);
            }
            return next;
        });
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (!data.barcode && data.product_ids.length === 0) {
            setErrors((prev) => [...prev, "Please fill / select one"]);
            return;
        }

        post("/barcode-report", {
            preserveState: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (barcode) {
            setData((prev) => ({
                ...prev,
                barcode: barcode,
                product_ids: [],
            }));
            setSelectedProducts([]);
        }
    }, [barcode]);

    useEffect(() => {
        if (errors.length > 0) {
            const timeoutId = setTimeout(() => {
                setErrors((prev) => prev.slice(1)); // Remove the first error
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    useEffect(() => {
        if (props.products) {
            const products = props.products.map((p) => ({
                label: p.Catalog,
                value: p.CatalogId,
            }));
            setProducts(products);
        }
        if (props.errors) {
            Object.entries(props.errors).forEach((e) => {
                setErrors((prev) => [...prev, e[1]]);
            });
        }
        if (props.summary) {
            setSummary(props.summary[0]);
        }
        if (props.delivery) {
            setDelivery(props.delivery);
        }
        if (props.location_report) {
            setLocationReport(props.location_report);
            setExpandedLocationProducts(new Set());
        }
        if (props.product_summary) {
            setProductSummary(props.product_summary);
        }
    }, [props]);

    return (
        <>
            <Navbar />
            <div
                className={`page__loader ${processing ? "loading" : ""}`}
            ></div>
            <div
                className="mobile-nav__btn"
                onClick={() => setShowMobileNav(true)}
            >
                <Menu className="mobile-nav__icon" />
            </div>
            <MobileNav
                show={showMobileNav}
                setShowMobileNav={setShowMobileNav}
            />
            {showScanner && (
                <Scanner
                    setShowScanner={setShowScanner}
                    setBarcode={setBarcode}
                    setErrors={setErrors}
                />
            )}
            <div className="p-s-g">
                <div className="title">
                    <h3>Search</h3>
                </div>
                <form className="p-s-g__form" onSubmit={submitForm}>
                    <input
                        type="text"
                        placeholder="Barcode"
                        className="input"
                        id="universal-input"
                        value={data.barcode}
                        onChange={(e) => {
                            setData((prev) => ({
                                ...prev,
                                barcode: e.target.value,
                                product_ids: [],
                            }));
                            setSelectedProducts([]);
                        }}
                    />
                    <label htmlFor="universal-input" className="label">
                        Barcode
                    </label>
                    <ReactSelect
                        className="select"
                        isMulti
                        options={filteredProductOptions}
                        inputValue={productInput}
                        onInputChange={(val, meta) => {
                            if (meta.action === "input-change") {
                                setProductInput(val);
                            }
                        }}
                        filterOption={() => true}
                        components={{ MultiValue: CollapsedMultiValue }}
                        value={selectedProducts}
                        onChange={(selected) => {
                            const chosen = selected || [];
                            const isSelectAll = chosen.some(
                                (o) => o.value === SELECT_ALL_VALUE
                            );
                            let next;
                            if (isSelectAll) {
                                const matches = filteredProductOptions.filter(
                                    (o) => o.value !== SELECT_ALL_VALUE
                                );
                                const merged = [...selectedProducts, ...matches];
                                next = merged.filter(
                                    (opt, idx) =>
                                        merged.findIndex((o) => o.value === opt.value) ===
                                        idx
                                );
                            } else {
                                next = chosen;
                            }
                            setSelectedProducts(next);
                            setData((prev) => ({
                                ...prev,
                                barcode: "",
                                product_ids: next.map((o) => +o.value),
                            }));
                        }}
                        placeholder="Select Product(s)"
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary75: "color-mix(in srgb, #638663 70%, white)",
                                primary50: "color-mix(in srgb, #638663 45%, white)",
                                primary25: "color-mix(in srgb, #638663 20%, white)",
                                primary: "#638663",
                            },
                        })}
                    />
                    <label className="p-s-g__form-checkbox">
                        <input
                            type="checkbox"
                            checked={data.include_delivery}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    include_delivery: e.target.checked,
                                }))
                            }
                        />
                        Transaction Logs
                    </label>
                    <button className="btn" type="submit">
                        <Check className="btn__icon" />
                        Go
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={() => setShowScanner(true)}
                    >
                        <ScanLine className="btn__icon" />
                        Scan
                    </button>
                </form>
                {productSummary && productSummary.length > 0 && (
                    <div className="p-s-g__products">
                        <table>
                            <caption>Product Summary</caption>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Purchase Qty</th>
                                    <th>Sales Qty</th>
                                    <th>Sales Amount</th>
                                    <th>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productSummary.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.Catalog}</td>
                                        <td>{(+e.PurchaseQty).toFixed(2)}</td>
                                        <td>{(+e.SalesQty).toFixed(2)}</td>
                                        <td>{(+e.SalesAmount).toFixed(2)}</td>
                                        <td>{(+e.Stock).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {productSummary
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.PurchaseQty,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {productSummary
                                            .reduce(
                                                (acc, curr) => acc + +curr.SalesQty,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {productSummary
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.SalesAmount,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {productSummary
                                            .reduce(
                                                (acc, curr) => acc + +curr.Stock,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                {locationReport && locationReport.length > 0 && (
                    <div className="p-s-g__location">
                        <table>
                            <caption>Location Report</caption>
                            <thead>
                                <tr>
                                    <th>Shop / Product</th>
                                    <th>Sales Qty</th>
                                    <th>Sales Amount</th>
                                    <th>Stock</th>
                                    <th>Days Since First Delivery</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locationReportGrouped.map((group) => {
                                    const isExpanded =
                                        expandedLocationShops.has(
                                            group.ShopName
                                        );
                                    return (
                                        <React.Fragment key={group.ShopName}>
                                            <tr
                                                className="location-report__group-row"
                                                onClick={() =>
                                                    toggleLocationShop(
                                                        group.ShopName
                                                    )
                                                }
                                            >
                                                <td>
                                                    <span className="location-report__toggle">
                                                        {isExpanded ? (
                                                            <ChevronDown className="location-report__chevron" />
                                                        ) : (
                                                            <ChevronRight className="location-report__chevron" />
                                                        )}
                                                        {group.ShopName}
                                                    </span>
                                                </td>
                                                <td>
                                                    {group.SalesQty.toFixed(2)}
                                                </td>
                                                <td>
                                                    {group.SalesAmount.toFixed(
                                                        2
                                                    )}
                                                </td>
                                                <td>
                                                    {group.Stock.toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            {isExpanded &&
                                                group.products.map(
                                                    (product, i) => (
                                                        <tr
                                                            key={i}
                                                            className="location-report__product-row"
                                                        >
                                                            <td>
                                                                {
                                                                    product.Catalog
                                                                }
                                                            </td>
                                                            <td>
                                                                {(+product.SalesQty).toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                            <td>
                                                                {(+product.SalesAmount).toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                            <td>
                                                                {(+product.Stock).toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                            <td>
                                                                {product.DaysSinceFirstDelivery ??
                                                                    "-"}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {locationReport
                                            .reduce(
                                                (acc, curr) => acc + +curr.SalesQty,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {locationReport
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.SalesAmount,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {locationReport
                                            .reduce(
                                                (acc, curr) => acc + +curr.Stock,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                {summary && summary.Barcode && (
                    <div className="p-s-g__1">
                        <table>
                            <caption>Summary</caption>
                            <tbody>
                                <tr>
                                    <td>
                                        <span>Barcode</span>
                                        <p>{summary.Barcode}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Description</span>
                                        <p>{summary.Desc}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Size</span>
                                        <p>{summary.Size}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>HSN</span>
                                        <p>{summary.HSNCode}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Supplier</span>
                                        <p>{summary.Supplier}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Grn No</span>
                                        <p>{summary.GRNNo}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Grn Date</span>
                                        <p>
                                            {new Date(
                                                summary.GRNDt
                                            ).toLocaleDateString()}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Inv. No</span>
                                        <p>{summary.InvNo}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Inv. Date</span>
                                        <p>
                                            {new Date(
                                                summary.InvDt
                                            ).toLocaleDateString()}
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {summary && summary.Barcode && (
                    <div className="p-s-g__2">
                        <table>
                            <caption>Attributes</caption>
                            <tbody>
                                <tr>
                                    <td>
                                        <span>Department</span>
                                        <p>{summary.Department}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Category</span>
                                        <p>{summary.Category}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Style</span>
                                        <p>{summary.Style}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Pattern</span>
                                        <p>{summary.Pattern}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Material</span>
                                        <p>{summary.Material}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Color</span>
                                        <p>{summary.Color}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Sleeve</span>
                                        <p>{summary.Sleeve}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Brand</span>
                                        <p>{summary.Brand}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>Catalogue</span>
                                        <p>{summary.Catalog}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {delivery && delivery.length > 0 && (
                    <div className="p-s-g__5">
                        <table>
                            <caption>Delivery</caption>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Qty</th>
                                    <th>Del. On</th>
                                    <th>Rec. On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {delivery.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.DeliveryCode}</td>
                                        <td>{e.From.slice(5)}</td>
                                        <td>{e.To.slice(5)}</td>
                                        <td>{(+e.Qty).toFixed(2)}</td>
                                        <td>
                                            {new Date(
                                                e.DeliveryDate
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {new Date(
                                                e.ReceivedDate
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>
                                        {delivery
                                            .reduce(
                                                (acc, curr) => acc + +curr.Qty,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
            <Toast errors={errors} />
        </>
    );
};

export default Barcode;
