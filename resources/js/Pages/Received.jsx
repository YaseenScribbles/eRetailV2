import Navbar from "./components/Navbar";
import { useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
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
];

const Received = (props) => {
    const [shops, setShops] = useState([]);
    const { data, setData, processing, progress, post } = useForm({
        report: undefined,
        shop_id: undefined,
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
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
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [tableData, setTableData] = useState([]);
    const [reportStyle, setReportStyle] = useState("summary");
    const [showMobileNav, setShowMobileNav] = useState(false);

    // const [rowData, setRowData] = useState([]);
    // const defaultColDef = useMemo(() => {
    //     return {
    //         filter: "agTextColumnFilter",
    //         floatingFilter: true,
    //     };
    // }, []);

    // Column Definitions: Defines the columns to be displayed.
    // const [colDefs, setColDefs] = useState([]);
    const columnHelper = createColumnHelper();
    const summaryColumns = [
        columnHelper.accessor("delivery_code", {
            header: "Delivery Code",
            cell: (info) => info.getValue(),
            footer: () => <span>Total</span>,
        }),
        columnHelper.accessor("date", {
            header: "Date",
            cell: (info) => info.getValue(),
            footer: () => <span></span>,
        }),
        columnHelper.accessor("quantity", {
            header: "Quantity",
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
                        (acc, curr) => acc + +curr.getValue("quantity"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {qty.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("cp", {
            header: "Cost Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const cp = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("cp"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {cp.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("rp", {
            header: "Retail Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const rp = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("rp"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {rp.toFixed(2)}
                    </span>
                );
            },
        }),
    ];
    const detailColumns = [
        columnHelper.accessor("delivery_code", {
            header: "Delivery Code",
            cell: (info) => info.getValue(),
            footer: () => <span>Total</span>,
        }),
        columnHelper.accessor("date", {
            header: "Date",
            cell: (info) => info.getValue(),
            footer: () => <span></span>,
        }),
        columnHelper.accessor("barcode", {
            header: "Barcode",
            cell: (info) => info.getValue(),
            footer: () => <span></span>,
        }),
        columnHelper.accessor("quantity", {
            header: "Quantity",
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
                        (acc, curr) => acc + +curr.getValue("quantity"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {qty.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("cp", {
            header: "Cost Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const cp = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("cp"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {cp.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("rp", {
            header: "Retail Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const rp = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("rp"), 0);
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {rp.toFixed(2)}
                    </span>
                );
            },
        }),
    ];

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

        onPaginationChange: setPagination,
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
        setShowRange(false);
        post("/received-report", {
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
            setTableData(
                props.result.map((row) => ({
                    ...row,
                    date: new Date(row.date).toLocaleDateString(),
                    quantity: (+row.quantity).toFixed(2),
                    cp: (+row.cp).toFixed(2),
                    rp: (+row.rp).toFixed(2),
                }))
            );
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
            <div className="received page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Received Report</h3>
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
                        reportName={"Received Report"}
                    />
                )}
                {/* <div className="toast-container">
                    {errors.length > 0 &&
                        errors.map((error, index) => (
                            <div key={index} className="toast show">
                                <h5 className="app-name">
                                    <svg className="app-icon">
                                        <use xlinkHref="/images/sprite.svg#icon-shopping-bag"></use>
                                    </svg>
                                    eRetail
                                </h5>
                                <p className="message">{error}</p>
                            </div>
                        ))}
                </div> */}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Received;
