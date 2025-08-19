import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { DateRangePicker } from "react-date-range";
import CaptionHeadBody from "./components/CaptionHeadBody";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { useForm } from "@inertiajs/react";
import { format } from "date-fns";
import MobileNav from "./components/MobileNav";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesPersonSummary, getStockSummary } from "./Apis/Dashboard";
// import { router } from "@inertiajs/react";

const Dashboard = (props) => {
    const [showRange, setShowRange] = useState(false);
    const [duration, setDuration] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);
    const [shopwiseSales, setShopwiseSales] = useState([]);
    const [settlement, setSettlement] = useState([]);
    const [top10Products, setTop10Products] = useState([]);
    const [top10ReturnProducts, setTop10ReturnProducts] = useState([]);
    // const [stockSummary, setStockSummary] = useState([]);
    const [top10Category, setTop10Category] = useState([]);
    const { data, setData, get, processing } = useForm({
        from_date: format(new Date(), "yyyy-MM-dd"),
        to_date: format(new Date(), "yyyy-MM-dd"),
    });
    const [showMobileNav, setShowMobileNav] = useState(false);
    // const [stockSummaryLoading, setStockSummaryLoading] = useState(true);
    const queryClient = useQueryClient();

    const { data: { salesPersons } = {}, isLoading: isSalesPersonsLoading } =
        useQuery({
            queryKey: ["dashboard", "salespersons"],
            queryFn: () => getSalesPersonSummary(data.from_date, data.to_date),
        });

    const { data: { stockSummary } = {}, isLoading: stockSummaryLoading } =
        useQuery({
            queryKey: ["dashboard", "stockSummary"],
            queryFn: getStockSummary,
        });

    //for dragging menu
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e) => {
        dragging.current = true;
        const touch = e.touches[0];
        offset.current = {
            x: touch.clientX - dragPosition.x,
            y: touch.clientY - dragPosition.y,
        };
    };

    const handleTouchMove = (e) => {
        if (!dragging.current) return;
        const touch = e.touches[0];
        const newX = touch.clientX - offset.current.x;
        const newY = touch.clientY - offset.current.y;
        setDragPosition({
            x: newX,
            y: newY,
        });
    };

    const handleTouchEnd = () => {
        dragging.current = false;
    };

    useEffect(() => {
        if (props.shopwiseSales.length > 0) {
            const data = props.shopwiseSales.map((row) => ({
                ...row,
                amount: (+row.amount).toFixed(2),
            }));
            setShopwiseSales(data);
        } else {
            setShopwiseSales([]);
        }

        if (props.settlement.length > 0) {
            const data = props.settlement.map((e) => ({
                ...e,
                cash: (+e.cash).toFixed(2),
                card: (+e.card).toFixed(2),
                upi: (+e.upi).toFixed(2),
            }));
            setSettlement(data);
        } else {
            setSettlement([]);
        }

        if (props.top10Products.length > 0) {
            const data = props.top10Products.map((e) => ({
                ...e,
                qty: (+e.qty).toFixed(2),
            }));
            setTop10Products(data);
        } else {
            setTop10Products([]);
        }

        if (props.top10ReturnProducts.length > 0) {
            const data = props.top10ReturnProducts.map((e) => ({
                ...e,
                qty: (+e.qty).toFixed(2),
            }));
            setTop10ReturnProducts(data);
        } else {
            setTop10ReturnProducts([]);
        }

        // if (props.stockSummary.length > 0) {
        //     const data = props.stockSummary.map((e) => ({
        //         ...e,
        //         cost: (+e.cost).toFixed(2),
        //         mrp: (+e.mrp).toFixed(2),
        //         stock: (+e.stock).toFixed(2),
        //     }));
        //     setStockSummary(data);
        // } else {
        //     setStockSummary([]);
        // }

        if (props.top10Category.length > 0) {
            const data = props.top10Category
                .map((e) => ({
                    Category: e.category.toUpperCase(),
                    Quantity: +(+e.qty).toFixed(2),
                }))
                .sort(() => Math.random() - 0.5);

            setTop10Category(data);
        } else {
            setTop10Category([]);
        }

        if (props.user) {
            localStorage.setItem(
                "eRetail_user",
                JSON.stringify({
                    name: props.user.name,
                    role: props.user.role,
                    has_invoice_report: props.user.has_invoice_report,
                })
            );
        }
    }, [props]);

    useEffect(() => {
        setData((prev) => ({
            ...prev,
            from_date: format(duration[0].startDate, "yyyy-MM-dd"),
            to_date: format(duration[0].endDate, "yyyy-MM-dd"),
        }));
    }, [duration]);

    // useEffect(() => {
    //     axios
    //         .get("/stock-summary", {
    //             headers: {
    //                 Accept: "application/json",
    //             },
    //         })
    //         .then(({ data }) => {
    //             if (data) {
    //                 const stockSummary = data.stockSummary.map((e) => ({
    //                     ...e,
    //                     cost: (+e.cost).toFixed(2),
    //                     mrp: (+e.mrp).toFixed(2),
    //                     stock: (+e.stock).toFixed(2),
    //                 }));
    //                 setStockSummary(stockSummary);
    //                 setStockSummaryLoading(false);
    //             }
    //         })
    //         .catch((error) => console.log(error));
    // }, []);

    return (
        <>
            <Navbar />
            <div
                className={`page__loader ${processing ? "loading" : ""}`}
            ></div>
            <div
                className="mobile-nav__btn"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setShowMobileNav(true)}
                style={{
                    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
                    touchAction: "none",
                }}
            >
                <svg className="mobile-nav__icon">
                    <use xlinkHref="/images/sprite.svg#icon-menu"></use>
                </svg>
            </div>
            <MobileNav
                show={showMobileNav}
                setShowMobileNav={setShowMobileNav}
            />
            <div className="grid-container">
                <div className="title">
                    <h3>Dashboard</h3>
                    <div className="buttons">
                        <button
                            className="btn"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowRange(!showRange);
                            }}
                        >
                            Range
                        </button>
                        <button
                            className="btn"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowRange(false);
                                get("/dashboard", {
                                    preserveState: true,
                                    preserveScroll: true,
                                });
                                queryClient.invalidateQueries({
                                    queryKey: ["dashboard"],
                                });
                            }}
                        >
                            Go
                        </button>
                    </div>
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
                {shopwiseSales.length > 0 && (
                    <div className="cell cell-1">
                        <table className="dashboard-table dashboard-table--1">
                            <CaptionHeadBody
                                data={shopwiseSales}
                                title={"Sales"}
                            />
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {shopwiseSales.reduce(
                                            (acc, curr) => acc + +curr.qty,
                                            0
                                        )}
                                    </td>
                                    <td>
                                        {shopwiseSales
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.amount,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                {settlement.length > 0 && (
                    <div className="cell cell-2">
                        <table className="dashboard-table dashboard-table--2">
                            <CaptionHeadBody
                                data={settlement}
                                title={"SETTLEMENT"}
                            />
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {settlement
                                            .reduce(
                                                (acc, curr) => acc + +curr.cash,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {settlement
                                            .reduce(
                                                (acc, curr) => acc + +curr.card,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {settlement
                                            .reduce(
                                                (acc, curr) => acc + +curr.upi,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                {top10Products.length > 0 && (
                    <div className="cell cell-3">
                        <table className="dashboard-table dashboard-table--3">
                            <CaptionHeadBody
                                data={top10Products}
                                title={"Sold Products - Top 10"}
                            />
                        </table>
                    </div>
                )}
                {top10ReturnProducts.length > 0 && (
                    <div className="cell cell-4">
                        <table className="dashboard-table dashboard-table--4">
                            <CaptionHeadBody
                                data={top10ReturnProducts}
                                title={"Return Products - Top 10"}
                            />
                        </table>
                    </div>
                )}
                {top10Category.length > 0 && (
                    <div className="cell cell-5 chart">
                        <label>Category - Top 10</label>
                        <ResponsiveContainer
                            height="100%"
                            width="100%"
                            style={{
                                backgroundColor: "#fff",
                                padding: "0.5rem",
                            }}
                        >
                            <BarChart
                                data={top10Category}
                                margin={{
                                    top: 10,
                                    right: 30,
                                }}
                            >
                                <CartesianGrid />
                                <XAxis
                                    dataKey="Category"
                                    angle={-20}
                                    textAnchor="end"
                                    interval={0}
                                    fontSize={9}
                                />
                                <YAxis dataKey="Quantity" />
                                <Tooltip />
                                <Legend
                                    wrapperStyle={{ paddingTop: "1rem" }}
                                    iconType="star"
                                />
                                <Bar dataKey="Quantity" fill="#638663" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {stockSummaryLoading ? (
                    <div className="cell stock">
                        <p>
                            Stock summary loading<span>.</span>
                            <span>.</span>
                            <span>.</span>
                        </p>
                    </div>
                ) : (
                    <div className="cell cell-6">
                        <table className="dashboard-table dashboard-table--6">
                            <CaptionHeadBody
                                data={stockSummary}
                                title={"stock summary"}
                            />
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {stockSummary
                                            .reduce(
                                                (acc, curr) => acc + +curr.cost,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {stockSummary
                                            .reduce(
                                                (acc, curr) => acc + +curr.mrp,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {stockSummary
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.stock,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {isSalesPersonsLoading ? (
                    <div className="cell stock">
                        <p>
                            Sales persons loading<span>.</span>
                            <span>.</span>
                            <span>.</span>
                        </p>
                    </div>
                ) : (
                    salesPersons &&
                    salesPersons.length > 0 && (
                        <div className="cell cell-7">
                            <table className="dashboard-table dashboard-table--7">
                                <CaptionHeadBody
                                    data={salesPersons}
                                    title={"Top Sales Persons"}
                                />
                                <tfoot>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td>
                                            {salesPersons
                                                .reduce(
                                                    (acc, curr) =>
                                                        acc + +curr.Qty,
                                                    0
                                                )
                                                .toFixed(2)}
                                        </td>
                                        <td>
                                            {salesPersons
                                                .reduce(
                                                    (acc, curr) =>
                                                        acc + +curr.Amount,
                                                    0
                                                )
                                                .toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )
                )}
            </div>
        </>
    );
};

export default Dashboard;
