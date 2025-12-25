import { useEffect, useState } from "react";

const PaymentModal = (props) => {
    const [payment, setPayment] = useState({
        cash: "",
        card: "",
        upi: "",
    });

    const [prevPayment, setPrevPayment] = useState({
        cash: "",
        card: "",
        upi: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (isNaN(value)) return;

        setPayment((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    useEffect(() => {
        if (props.payment) {
            setPrevPayment({
                cash: +props.payment.CASH ?? "",
                card: +props.payment.CARD ?? "",
                upi: +props.payment.UPI ?? "",
            });
        }
        if (!props.show) {
            setPayment({
                cash: "",
                card: "",
                upi: "",
            });
        }
    }, [props]);

    return (
        <dialog className="modal" open={props.show}>
            <div className="modal__header">Payment Info (Bill No:{props.billNo})</div>
            <div className="modal__body">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Mode</th>
                            <th>Prev.</th>
                            <th>New</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>CASH</td>
                            <td>{(+prevPayment.cash).toFixed(2)}</td>
                            <td>
                                <input
                                    name="cash"
                                    type="text"
                                    inputMode="numeric"
                                    className="input"
                                    value={payment.cash}
                                    onChange={handleChange}
                                    style={{
                                        textAlign: "center",
                                    }}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>CARD</td>
                            <td>{(+prevPayment.card).toFixed(2)}</td>
                            <td>
                                <input
                                    name="card"
                                    type="text"
                                    inputMode="numeric"
                                    className="input"
                                    value={payment.card}
                                    onChange={handleChange}
                                    style={{
                                        textAlign: "center",
                                    }}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>UPI</td>
                            <td>{(+prevPayment.upi).toFixed(2)}</td>
                            <td>
                                <input
                                    name="upi"
                                    type="text"
                                    inputMode="numeric"
                                    className="input"
                                    value={payment.upi}
                                    onChange={handleChange}
                                    style={{
                                        textAlign: "center",
                                    }}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="buttons">
                    <button
                        className="btn btn--no"
                        onClick={() => {
                            props.onNo();
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            setIsSubmitting(true);
                            props.onYes(payment, setIsSubmitting);
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Updating..." : "Update"}
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default PaymentModal;
