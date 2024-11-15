import { useForm } from "@inertiajs/react";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { format } from "date-fns";
import ReactSelect from "react-select";
import { DateRangePicker } from "react-date-range";
import axios from "axios";
import Grid from "./components/Grid";
import Toast from "./components/Toast";
import MobileNav from "./components/MobileNav";

const Invoice = (props) => {
    const { data, setData, processing, post } = useForm({
        f_year: "",
        from_date: format(new Date(), "yyyy-MM-dd"),
        to_date: format(new Date(), "yyyy-MM-dd"),
        destination: "",
    });
    const [showRange, setShowRange] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [buyers, setBuyers] = useState([]);
    const [errors, setErrors] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [duration, setDuration] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const columnHelper = createColumnHelper();

    const columns = [
        columnHelper.accessor("invoiceno", {
            header: "Inv. No",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("invoicedate", {
            header: "Inv. Date",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("product", {
            header: "Product",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("size", {
            header: "Size",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("hsn", {
            header: "HSN",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("quantity", {
            header: "Qty",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const totalQty = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("quantity"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {totalQty.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("rate", {
            header: "Rate",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("amount", {
            header: "Amount",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const totalAmount = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("amount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {totalAmount.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("discperc", {
            header: "Disc. %",
            cell: (info) => info.getValue(),
            footer: "",
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
                const totalDisc = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("discount"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {totalDisc.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("taxable", {
            header: "Taxable",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const taxable = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("taxable"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {taxable.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("gstperc", {
            header: "GST %",
            cell: (info) => info.getValue(),
            footer: "",
        }),
        columnHelper.accessor("gst", {
            header: "GST",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const gst = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, curr) => acc + +curr.getValue("gst"), 0);
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {gst.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("nett", {
            header: "Nett",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const nett = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("nett"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "end" }}>
                        {nett.toFixed(2)}
                    </span>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: tableData,
        columns,
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

        if (data.f_year === "") {
            setErrors((prev) => [...prev, "Please select financial year"]);
            errors.push("Please select financial year");
        }
        if (data.destination === "") {
            setErrors((prev) => [...prev, "Please select destination"]);
            errors.push("Please select destination");
        }
        if (errors.length > 0) return;
        setShowRange(false);
        post("/invoice-report", {
            preserveScroll: true,
            preserveState: true,
        });
    };

    useEffect(() => {
        if (errors.length > 0) {
            const timeoutId = setTimeout(() => {
                setErrors((prev) => prev.slice(1)); // Remove the first error
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    useEffect(() => {
        axios.defaults.withCredentials = true;
        axios
            .get(`/buyers?f_year=${data.f_year || "2425"}`)
            .then(({ data }) => {
                if (data) {
                    const buyerOptions = data.buyers.map((buyer) => ({
                        label: buyer.name,
                        value: buyer.destination,
                    }));
                    setBuyers(buyerOptions);
                }
            })
            .catch((_) => {
                setErrors((prev) => [...prev, "Error fetching buyers"]);
            });
    }, [data.f_year]);

    useEffect(() => {
        setData((prev) => ({
            ...prev,
            from_date: format(duration[0].startDate, "yyyy-MM-dd"),
            to_date: format(duration[0].endDate, "yyyy-MM-dd"),
        }));
    }, [duration]);

    useEffect(() => {
        if (props.result.length > 0) {
            const tableData = props.result.map((e) => ({
                ...e,
                invoicedate: format(e.invoicedate, "dd-MM-yyyy"),
                quantity: (+e.quantity).toFixed(2),
                rate: (+e.rate).toFixed(2),
                amount: (+e.amount).toFixed(2),
                discperc: (+e.discperc).toFixed(2),
                discount: (+e.discount).toFixed(2),
                taxable: (+e.taxable).toFixed(2),
                gstperc: (+e.gstperc).toFixed(2),
                gst: (+e.gst).toFixed(2),
                nett: (+e.nett).toFixed(2),
            }));
            setTableData(tableData);
        }
    }, [props]);

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
            <div className="invoice page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Invoice Report</h3>
                </div>
                <form
                    className="page__form"
                    method="post"
                    onSubmit={fetchReport}
                >
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            options={[
                                { label: "2024-25", value: "2425" },
                                { label: "2023-24", value: "2324" },
                            ]}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    f_year: e.value,
                                }))
                            }
                            placeholder="Select Financial Year"
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
                            options={buyers}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    destination: e.value,
                                }))
                            }
                            placeholder="Select Buyer"
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
                        reportName="Invoice Report"
                        tooltipColumns={['product']}
                    />
                )}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Invoice;
