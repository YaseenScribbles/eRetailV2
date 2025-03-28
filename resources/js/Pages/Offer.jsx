import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import { useForm } from "@inertiajs/react";
import ReactSelect from "react-select";
import Grid from "./components/Grid";
import Toast from "./components/Toast";
import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";

const Offer = (props) => {
    const [showMobileNav, setShowMobileNav] = useState(false);
    const { data, setData, processing, post } = useForm({
        shop_id: "",
    });
    const [shops, setShops] = useState([]);
    const [errors, setErrors] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [tableData, setTableData] = useState([]);
    const columnHelper = createColumnHelper();
    const columns = [
        columnHelper.accessor("Barcode"),
        columnHelper.accessor("Desc"),
        columnHelper.accessor("Size"),
        columnHelper.accessor("CostPrice"),
        columnHelper.accessor("RetailPrice"),
        columnHelper.accessor("Discount"),
        columnHelper.accessor("Stock"),
        columnHelper.accessor("Department"),
        columnHelper.accessor("Category"),
        columnHelper.accessor("Material"),
        columnHelper.accessor("Catalog"),
    ];

    const table = useReactTable({
        data: tableData,
        columns: columns,
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

        if (data.shop_id === '') {
            setErrors((prev) => [...prev, "Please select shop"]);
            errors.push("Please select shop");
        }
        if (errors.length > 0) return;
        post("/offer", {
            preserveScroll: true,
            preserveState: true,
        });
    };

    useEffect(() => {
        if (props) {
            const shops = props.shops.map((shop) => ({
                label: shop.shopname,
                value: shop.shopid,
            }));
            setShops(shops);

            setTableData(
                props.result.map((row) => ({
                    ...row,
                    CostPrice: (+row.CostPrice).toFixed(2),
                    RetailPrice: (+row.RetailPrice).toFixed(2),
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
            <div className="offer page">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Offer Report</h3>
                </div>
                <form
                    method="GET"
                    className="page__form"
                    onSubmit={fetchReport}
                >
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
                            onClick={fetchReport}
                            disabled={processing}
                            type="submit"
                            className="btn"
                        >
                            Go
                        </button>
                    </div>
                </form>
                <Grid
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    table={table}
                    tableData={tableData}
                    reportName={"Offer Report"}
                    footerRequired={false}
                    tooltipColumns={["Desc", "Catalog"]}
                />
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Offer;
