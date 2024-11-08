import { useForm } from "@inertiajs/react";
import Navbar from "../Pages/components/Navbar";
import ReactSelect from "react-select";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRangePicker } from "react-date-range";
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

const CvS = (props) => {
    const {  setData, post, processing } = useForm({
        shop_id: 0,
        from_date: format(new Date(), "yyyy-MM-dd"),
        to_date: format(new Date(), "yyyy-MM-dd"),
    });
    const [shops, setShops] = useState([]);
    const [showRange, setShowRange] = useState(false);
    const [duration, setDuration] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);
    const [tableData, setTableData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [showMobileNav, setShowMobileNav] = useState(false);

    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor("shopname", {
            header: "Shop Name",
            cell: (info) => info.getValue(),
            footer: "Total",
        }),
        columnHelper.accessor("costvalue", {
            header: "Cost Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const cv = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("costvalue"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {cv.toFixed(2)}
                    </span>
                );
            },
        }),
        columnHelper.accessor("salevalue", {
            header: "Sale Value",
            cell: (info) => {
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {info.getValue()}
                    </span>
                );
            },
            footer: () => {
                const sv = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, curr) => acc + +curr.getValue("salevalue"),
                        0
                    );
                return (
                    <span style={{ display: "block", textAlign: "right" }}>
                        {sv.toFixed(2)}
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
        setShowRange(false);
        post("/cvs-report", {
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
        setData((prev) => ({
            ...prev,
            from_date: format(duration[0].startDate, "yyyy-MM-dd"),
            to_date: format(duration[0].endDate, "yyyy-MM-dd"),
        }));
    }, [duration]);

    useEffect(() => {
        if (props.shops.length > 0) {
            const shops = props.shops.map((shop) => ({
                label: shop.shopname,
                value: shop.shopid,
            }));
            shops.push({ label: "ALL", value: 0 });
            shops.sort((a,b) => a.value - b.value);

            setShops(shops);
        }

        if (props.report.length > 0) {
            const data = props.report.map((e) => ({
                ...e,
                costvalue: +(+e.costvalue).toFixed(2),
                salevalue: +(+e.salevalue).toFixed(2),
            }));

            setTableData(data);
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
            <div className="cvs page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Cost Vs. Sale Report</h3>
                </div>
                <form
                    action="POST"
                    className="page__form"
                    onSubmit={fetchReport}
                >
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            placeholder="Select Shop"
                            options={shops}
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
                        reportName={"CvS Report"}
                    />
                )}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default CvS;
