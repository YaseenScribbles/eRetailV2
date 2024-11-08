import Navbar from "./components/Navbar";
import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
//import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
//import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
//import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { format } from "date-fns";
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
    {
        label: "Payment",
        value: "payment",
    },
];

const columnHelper = createColumnHelper();

const Sales = (props) => {
    const [shops, setShops] = useState([]);
    const { data, setData, processing, progress, post } = useForm({
        report: undefined,
        shop_id: undefined,
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
    });
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [tableData, setTableData] = useState([]);
    const [reportStyle, setReportStyle] = useState("summary");
    const summaryColumns = [
        columnHelper.accessor("bill_no", {
            header: "Bill No",
            cell: (info) => info.getValue(),
            footer: () => <span>Total</span>,
        }),
        columnHelper.accessor("bill_date", {
            header: "Bill Date",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("total_qty", {
            header: "Total Qty",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const qty = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("total_qty"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {qty.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("total_amount", {
            header: "Total Amount",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const amount = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("total_amount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {amount.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("disc_amount", {
            header: "Disc Amount",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const disc = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("disc_amount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {disc.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("final_amount", {
            header: "Final Amount",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const amount = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("final_amount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {amount.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("customer", {
            header: "Customer",
            cell: (info) => info.getValue(),
            footer: "",
        }),
    ];
    const detailColumns = [
        columnHelper.accessor("bill_no", {
            header: "Bill No",
            cell: (info) => info.getValue(),
            footer: "Total",
        }),
        columnHelper.accessor("bill_date", {
            header: "Bill Date",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("barcode", {
            header: "Barcode",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("description", {
            header: "Description",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("sale_qty", {
            header: "Qty",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const qty = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("sale_qty"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {qty.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("cost_price", {
            header: "Cost",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const cost = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("cost_price"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {cost.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("mrp", {
            header: "MRP",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const mrp = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("mrp"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {mrp.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("discount", {
            header: "Discount",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const disc = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("discount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {disc.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("sale_price", {
            header: "Sale",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const sale = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("sale_price"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {sale.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("hsn_code", {
            header: "HSN",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("tax_perc", {
            header: "Tax %",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("sale_tax", {
            header: "Tax",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const tax = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("sale_tax"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {tax.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("profit_perc", {
            header: "Profit %",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: "",
        }),
    ];
    const paymentColumns = [
        columnHelper.accessor("bill_date", {
            header: "Bill Date",
            cell: (info) => info.getValue(),
            footer: "Total",
        }),
        columnHelper.accessor("cash", {
            header: "Cash",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const cash = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("cash"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {cash.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("card", {
            header: "Card",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const card = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("card"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {card.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("upi", {
            header: "Upi",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const upi = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("upi"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {upi.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("total", {
            header: "Total",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const total = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("total"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {total.toFixed(2)}
                    </span>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: tableData,
        columns:
            reportStyle === "summary"
                ? summaryColumns
                : reportStyle === "details"
                ? detailColumns
                : paymentColumns,
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

        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
    });

    const [duration, setDuration] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);
    const [showRange, setShowRange] = useState(false);
    const [errors, setErrors] = useState([]);
    const [showMobileNav, setShowMobileNav] = useState(false);
    // const [rowData, setRowData] = useState([]);
    // const defaultColDef = useMemo(() => {
    //     return {
    //         filter: "agTextColumnFilter",
    //         floatingFilter: true,
    //     };
    // }, []);

    // // Column Definitions: Defines the columns to be displayed.
    // const [colDefs, setColDefs] = useState([]);

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
        setShowRange(false);
        post("/sales-report", {
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

        if (props.result.length > 0) {
            // const columnDefs = Object.keys(props.result[0]).map((key) => ({
            //     headerName: key.replace(/_/g, " ").toUpperCase(), // Replace underscores with spaces and convert to uppercase
            //     field: key,
            // }));
            // setColDefs(columnDefs);
            setReportStyle(props.reportStyle);
            if (data.report == "summary") {
                // setRowData(
                //     props.result.map((row) => ({
                //         ...row,
                //         bill_date: new Date(row.bill_date).toLocaleDateString(),
                //         total_amount: (+row.total_amount).toFixed(2),
                //         disc_amount: (+row.disc_amount).toFixed(2),
                //         final_amount: (+row.final_amount).toFixed(2),
                //     }))
                // );
                setTableData(
                    props.result.map((row) => ({
                        ...row,
                        bill_date: new Date(row.bill_date).toLocaleDateString(),
                        total_amount: (+row.total_amount).toFixed(2),
                        disc_amount: (+row.disc_amount).toFixed(2),
                        final_amount: (+row.final_amount).toFixed(2),
                    }))
                );
            } else if (data.report == "payment") {
                setTableData(
                    props.result.map((row) => ({
                        ...row,
                        bill_date: new Date(row.bill_date).toLocaleDateString(),
                        cash: (+row.cash).toFixed(2),
                        card: (+row.card).toFixed(2),
                        upi: (+row.upi).toFixed(2),
                        total: (+row.total).toFixed(2),
                    }))
                );
            } else {
                setTableData(
                    props.result.map((row) => ({
                        ...row,
                        bill_date: new Date(row.bill_date).toLocaleDateString(),
                        sale_qty: (+row.sale_qty).toFixed(2),
                        cost_price: (+row.cost_price).toFixed(2),
                        mrp: (+row.mrp).toFixed(2),
                        discount: (+row.discount).toFixed(2),
                        sale_price: (+row.sale_price).toFixed(2),
                        sale_tax: (+row.sale_tax).toFixed(2),
                        profit_perc: (+row.profit_perc).toFixed(2),
                    }))
                );
            }
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

    useEffect(() => {
        setData((prev) => ({
            ...prev,
            start_date: format(duration[0].startDate, "yyyy-MM-dd"),
            end_date: format(duration[0].endDate, "yyyy-MM-dd"),
        }));
    }, [duration]);

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
            <div className="sales page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Sales Report</h3>
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
                    <div className="form__group form__group--date">
                        <button
                            className="btn"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowRange(!showRange);
                            }}
                        >
                            Range picker
                        </button>
                        <DateRangePicker
                            className={`date-range ${showRange ? " show" : ""}`}
                            onChange={(item) => setDuration([item.selection])}
                            showSelectionPreview={true}
                            moveRangeOnFirstSelection={false}
                            ranges={duration}
                            direction="horizontal"
                            rangeColors={["#638663"]}
                        />
                    </div>
                    <div className="form__group">
                        <button
                            onClick={fetchReport}
                            disabled={processing}
                            type="submit"
                            className="btn"
                        >
                            Go
                        </button>
                    </div>
                </form>
                {tableData.length > 0 && (
                    //<div
                    //    className="ag-theme-quartz grid" // applying the Data Grid theme
                    //    style={{ height: "50rem", width: "100%" }} // the Data Grid will fill the size of the parent container
                    //>
                    //    <AgGridReact
                    //        rowData={rowData}
                    //        columnDefs={colDefs}
                    //        pagination
                    //        defaultColDef={defaultColDef}
                    //        paginationPageSize={10}
                    //        paginationPageSizeSelector={[10, 25, 50]}
                    //    />
                    //</div>
                    <Grid
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        table={table}
                        tableData={tableData}
                        reportName={"Sales Report"}
                        tooltipColumns={
                            reportStyle === "details" ? ["description"] : []
                        }
                    />
                )}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Sales;
