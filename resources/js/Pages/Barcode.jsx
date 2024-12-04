import React, { useEffect, useState, useRef } from "react";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import { useForm } from "@inertiajs/react";
import Toast from "./components/Toast";
import { BrowserCodeReader, BrowserQRCodeReader } from "@zxing/browser";

const Barcode = (props) => {
    const [showMobileNav, setShowMobileNav] = useState(false);
    const { post, processing, data, setData } = useForm({
        barcode: "",
    });
    const [summary, setSummary] = useState();
    const [stock, setStock] = useState([]);
    const [sales, setSales] = useState([]);
    const [delivery, setDelivery] = useState([]);
    const [errors, setErrors] = useState([]);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);

    const startZXingScanner = async () => {
        setScanning(true);
        setData((prev) => ({ ...prev, barcode: "" })); // Reset previous barcode
        setErrors([]); // Reset previous errors

        const codeReader = new BrowserQRCodeReader();

        try {
            // Get list of video input devices (cameras)
            const videoInputDevices =
                await BrowserCodeReader.listVideoInputDevices();

            if (videoInputDevices.length === 0) {
                setErrors((prev) => [...prev, "No camera devices found."]);
            }

            // Select the first camera (or adjust to use specific cameras)
            const selectedDeviceId = videoInputDevices[0].deviceId;

            // Start decoding from the selected camera
            codeReader.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        setData((prev) => ({
                            ...prev,
                            barcode: result.getText(),
                        }));
                        codeReader.reset(); // Stop scanning after successful result
                        setScanning(false);
                    }

                    if (error) {
                        setErrors((prev) => [...prev, error]); // Log scanning errors (e.g., no barcode in frame)
                    }
                }
            );
        } catch (err) {
            setErrors((prev) => [...prev, err.message]);
            setScanning(false);
        }
    };

    const stopScanning = () => {
        setScanning(false);
        if (videoRef.current) {
            videoRef.current.srcObject = null; // Stop video stream
        }
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (!data.barcode) {
            setErrors((prev) => [...prev, "Please enter barcode"]);
            return;
        }

        post("/barcode-report", {
            preserveState: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        return () => {
            stopScanning(); // Clean up when component unmounts
        };
    }, []);

    useEffect(() => {
        if (errors.length > 0) {
            const timeoutId = setTimeout(() => {
                setErrors((prev) => prev.slice(1)); // Remove the first error
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    useEffect(() => {
        if (props.errors) {
            Object.entries(props.errors).forEach((e) => {
                setErrors((prev) => [...prev, e[1]]);
            });
        }
        if (props.summary) {
            setSummary(props.summary[0]);
        }
        if (props.stock) {
            setStock(props.stock);
        }
        if (props.sales) {
            setSales(props.sales);
        }
        if (props.delivery) {
            setDelivery(props.delivery);
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
                <svg className="mobile-nav__icon">
                    <use xlinkHref="/images/sprite.svg#icon-menu"></use>
                </svg>
            </div>
            <MobileNav
                show={showMobileNav}
                setShowMobileNav={setShowMobileNav}
            />
            {scanning && (
                <video
                    className="scanner"
                    ref={videoRef}
                    style={{
                        width: "100%",
                        maxWidth: "40rem",
                        border: "1px solid #ccc",
                        margin: "2rem 0",
                    }}
                ></video>
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
                        onChange={(e) =>
                            setData((prev) => ({
                                ...prev,
                                barcode: e.target.value,
                            }))
                        }
                    />
                    <label htmlFor="universal-input" className="label">
                        Barcode
                    </label>
                    <button className="btn" type="submit">
                        Go
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={startZXingScanner}
                        // disabled={scanning}
                    >
                        {scanning ? (
                            "Scanning..."
                        ) : (
                            <svg className="search-icon">
                                <use xlinkHref="/images/sprite.svg#icon-magnifying-glass"></use>
                            </svg>
                        )}
                    </button>
                </form>
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
                {stock && stock.length > 0 && (
                    <div className="p-s-g__3">
                        <table>
                            <caption>Stock</caption>
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Stock</th>
                                    <th>Cost</th>
                                    <th>MRP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stock.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.ShopName}</td>
                                        <td>{(+e.stock).toFixed(2)}</td>
                                        <td>{(+e.CostPrice).toFixed(2)}</td>
                                        <td>{(+e.RetailPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {stock
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.stock,
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
                {sales && sales.length > 0 && (
                    <div className="p-s-g__4">
                        <table>
                            <caption>Sales</caption>
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Sales</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.ShopName}</td>
                                        <td>{(+e.Sales).toFixed(2)}</td>
                                        <td>{(+e.Amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td></td>
                                    <td>
                                        {sales
                                            .reduce(
                                                (acc, curr) =>
                                                    acc + +curr.Sales,
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td>
                                        {sales
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
