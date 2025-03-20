import { useForm } from "@inertiajs/react";
import React, { useEffect } from "react";

const SmsModal = (props) => {
    const { data, setData, processing, post } = useForm({
        mobile: "",
        template: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const testSms = async () => {
        if (!data.template) {
            props.addError("Please fill the template");
            return;
        }
        if (!data.mobile) {
            props.addError("Please fill the mobile");
            return;
        }

        post("/test-sms", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                props.addError("Sms sent successfully");
                props.setShow(false)
            },
        });
    };

    useEffect(() => {
        if (props) {
            setData((p) => ({
                ...p,
                mobile: props.mobile,
                template: props.template,
            }));
        }
    }, [props]);

    return (
        <dialog className="modal" open={props.show}>
            <div className="modal__header">
                <h4 className="heading">Test SMS</h4>
                <div className="close-btn">
                    <svg
                        className="close-icon"
                        onClick={() => props.setShow(false)}
                    >
                        <use xlinkHref="/images/sprite.svg#icon-cross"></use>
                    </svg>
                </div>
            </div>
            <div className="modal__body">
                <form className="form" method="POST">
                    <div className="form__group">
                        <input
                            type="text"
                            className="input"
                            placeholder="Mobile"
                            name="mobile"
                            value={data.mobile}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form__group">
                        <textarea
                            type="text"
                            className="input"
                            placeholder="Template"
                            name="template"
                            value={data.template}
                            onChange={handleChange}
                            rows={6}
                        />
                    </div>
                    <div className="form__group">
                        <button
                            onClick={testSms}
                            className="btn"
                            disabled={processing}
                            type="submit"
                        >
                            {`${processing ? 'Loading...' : 'TEST'}`}
                        </button>
                    </div>
                    <div className="form__group">
                        <label htmlFor="message">Bulk SMS Preview</label>
                        <textarea
                            type="text"
                            className="input"
                            placeholder="Bulk SMS"
                            name="message"
                            id="message"
                            value={props.message}
                            onChange={(e) => (props.setMessage(e.target.value))}
                            rows={6}
                        />
                    </div>
                </form>
            </div>
        </dialog>
    );
};

export default SmsModal;
