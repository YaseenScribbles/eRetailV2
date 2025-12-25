import { useEffect, useState } from "react";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import axios from "axios";

function BillDateModal({
    show,
    setShow,
    onNo,
    onYes,
    billDetail,
    setNotification,
    billNo,
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState(new Date());
    const [minDate, setMinDate] = useState(new Date());
    const [maxDate, setMaxDate] = useState(new Date());
    const [isSuccess, setIsSuccess] = useState(false);

    const updateBillDate = () => {
        // if (date > new Date().toLocaleDateString()) {
        //     setNotification(["Please select valid date"]);
        //     return;
        // }
        return new Promise((resolve) => {
            setIsSubmitting(true);
            const formattedDate = date.toLocaleDateString("en-GB");
            axios
                .post("/billdate", {
                    bill_id: billDetail.bill_id,
                    date: formattedDate,
                })
                .then((response) => {
                    setIsSuccess(true);
                    setIsSubmitting(false);
                    setShow(false);
                    setDate(new Date());
                    if (response.data) setNotification([response.data.message]);
                    resolve(true);
                })
                .catch((error) => {
                    if (error.response) {
                        const msg =
                            error.response.data.message || "Unknown error";
                        setNotification([msg]);
                    } else if (error.request) {
                        setNotification(["No response from server."]);
                    } else {
                        setNotification(["Request error: " + error.message]);
                    }
                    setIsSuccess(false);
                    setIsSubmitting(false);
                    resolve(false);
                });
        });
    };

    const parseDMYtoDate = (date) => {
        const [day, month, year] = date.split("/").map(Number);
        return new Date(year, month - 1, day);
    };

    useEffect(() => {
        if (billDetail?.bill_date) {
            const parsedBillDate = billDetail?.bill_date
                ? parseDMYtoDate(billDetail.bill_date)
                : new Date();

            setMaxDate(parsedBillDate);
            setMinDate(
                new Date(
                    parsedBillDate.getFullYear(),
                    parsedBillDate.getMonth() - 1,
                    1
                )
            );
            setDate(parsedBillDate);
        }
    }, [billDetail]);

    return (
        <dialog className="modal date" open={show}>
            <div className="modal__header">Bill Date (Bill No:{billNo})</div>
            <div className="modal__body">
                <div className="form">
                    <div className="date-input">
                        <DatePicker
                            value={date}
                            onChange={(e) => {
                                setDate(new Date(e));
                            }}
                            minDate={minDate}
                            maxDate={maxDate}
                            clearIcon={null}
                        />
                    </div>
                    <div className="buttons">
                        <button
                            className="btn btn--no"
                            onClick={() => {
                                onNo();
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                updateBillDate().then(() => {
                                    onYes(isSuccess);
                                });
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    </div>
                </div>
            </div>
        </dialog>
    );
}

export default BillDateModal;
