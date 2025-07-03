import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ReactSelect from "react-select";
import { useForm } from "@inertiajs/react";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import Grid from "./components/Grid";
import Toast from "./components/Toast";
import MobileNav from "./components/MobileNav";

const reportOptions = [
    {
        label: "Summary",
        value: "summary",
    },
    {
        label: "Details",
        value: "details",
    },
];

const columnHelper = createColumnHelper();

const summaryColumns = [
    columnHelper.accessor("product", {
        cell: (info) => info.getValue(),
        header: "Product",
        footer: () => "Total",
    }),
    columnHelper.accessor("stock", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Stock",
        footer: (info) => {
            const stock = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("stock"), 0);
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {stock.toFixed(2)}
                </span>
            );
        },
    }),
    columnHelper.accessor("cp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Cost Price",
        footer: (info) => {
            const cp = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("cp"), 0);
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {cp.toFixed(2)}
                </span>
            );
        },
    }),
    columnHelper.accessor("rp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Retail Price",
        footer: (info) => {
            const rp = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("rp"), 0);
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {rp.toFixed(2)}
                </span>
            );
        },
    }),
];

const detailColumns = [
    columnHelper.accessor("product", {
        cell: (info) => info.getValue(),
        header: "Product",
        footer: "Total",
    }),
    columnHelper.accessor("barcode", {
        cell: (info) => info.getValue(),
        header: "Barcode",
        footer: "",
    }),
    columnHelper.accessor("description", {
        cell: (info) => info.getValue(),
        header: "Description",
        footer: "",
    }),
    columnHelper.accessor("size", {
        cell: (info) => info.getValue(),
        header: "Size",
        footer: "",
    }),
    columnHelper.accessor("stock", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Stock",
        footer: (info) => {
            const stock = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("stock"), 0);

            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {stock.toFixed(2)}
                </span>
            );
        },
    }),
    columnHelper.accessor("cp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Cost Price",
        footer: "",
    }),
    columnHelper.accessor("rp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Retail Price",
        footer: "",
    }),
    columnHelper.accessor("totcp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Total CP",
        footer: (info) => {
            const cp = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("totcp"), 0);
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {cp.toFixed(2)}
                </span>
            );
        },
    }),
    columnHelper.accessor("totrp", {
        cell: (info) => {
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {info.getValue()}
                </span>
            );
        },
        header: "Total RP",
        footer: (info) => {
            const rp = info.table
                .getFilteredRowModel()
                .rows.reduce((acc, curr) => acc + +curr.getValue("totrp"), 0);
            return (
                <span style={{ display: "block", textAlign: "end" }}>
                    {rp.toFixed(2)}
                </span>
            );
        },
    }),
    columnHelper.accessor("days", {
        cell: (info) => info.getValue(),
        header: "Days",
        footer: "",
    }),
];

const Stock = (props) => {
    const [shops, setShops] = useState([]);
    const [errors, setErrors] = useState([]);
    const { data, setData, processing, post } = useForm({
        report: undefined,
        shop_id: undefined,
    });
    const [tableData, setTableData] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setpagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [reportStyle, setReportStyle] = useState("");
    const [showMobileNav, setShowMobileNav] = useState(false);

    const table = useReactTable({
        data: tableData,
        columns: reportStyle === "summary" ? summaryColumns : detailColumns,
        state: {
            sorting,
            globalFilter,
            pagination,
        },

        getCoreRowModel: getCoreRowModel(),

        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),

        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),

        onPaginationChange: setpagination,
        getPaginationRowModel: getPaginationRowModel(),
    });

    const fetchReport = (e) => {
        e.preventDefault();

        let errors = [];

        if (data.report === undefined) {
            setErrors((prev) => [...prev, "Please select report option"]);
            errors.push("Please select report option");
        }
        if (data.shop_id === undefined) {
            setErrors((prev) => [...prev, "Please select shop"]);
            errors.push("Please select shop");
        }
        if (errors.length > 0) return;

        post("/stock-report", {
            preserveScroll: true,
            preserveState: true,
        });
    };

    useEffect(() => {
        const shops = props.shops.map((shop) => ({
            label: shop.shopname,
            value: shop.shopid,
        }));
        setShops(shops);

        const reportStyle = props.report_style;
        setReportStyle(reportStyle);

        if (data.report === "summary") {
            const data = props.result.map((e) => ({
                ...e,
                cp: (+e.cp).toFixed(2),
            }));

            setTableData(data);
        } else {
            const data = props.result.map((e) => ({
                ...e,
                stock: (+e.stock).toFixed(2),
                cp: (+e.cp).toFixed(2),
                rp: (+e.rp).toFixed(2),
                totcp: (+e.totcp).toFixed(2),
                totrp: (+e.totrp).toFixed(2),
            }));

            setTableData(data);
        }
    }, [props]);

    useEffect(() => {
        if (errors.length > 0) {
            const timeoutId = setTimeout(() => {
                setErrors((prev) => prev.slice(1)); // Remove the first error
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    return (
        <>
            <Navbar />
            <div
                className="mobile-nav__btn"
                onClick={() => setShowMobileNav(true)}
            >
                <svg className="mobile-nav__icon">
                    <use xlinkHref="/images/sprite.svg#icon-menu"></use>
                </svg>
            </div>
            <MobileNav
                show={showMobileNav}
                setShowMobileNav={setShowMobileNav}
            />
            <div className="stock page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Stock Report</h3>
                </div>
                <form
                    method="GET"
                    className="page__form"
                    onSubmit={fetchReport}
                >
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            options={reportOptions}
                            placeholder="Report Options"
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    report: e.value,
                                }))
                            }
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            options={shops}
                            placeholder="Shops"
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    shop_id: e.value,
                                }))
                            }
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                        ></ReactSelect>
                    </div>
                    <div className="form__group">
                        <button
                            disabled={processing}
                            type="submit"
                            className="btn"
                        >
                            Go
                        </button>
                    </div>
                </form>
                {tableData.length > 0 && (
                    <Grid
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        table={table}
                        tableData={tableData}
                        reportName="Stock Report"
                    />
                )}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Stock;
