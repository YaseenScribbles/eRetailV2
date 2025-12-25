import { useState } from "react";

const AlertModal = ({show, onNo, onYes, isProcessingRequired = false, billNo}) => {

    const [isSubmitting, setIsSubmitting] = useState(false)

    return (
        <dialog className="modal" open={show}>
            <div className="modal__header">
                <h4>Confirmation (Bill No:{billNo})</h4>
            </div>
            <div className="modal__body">
                <p>Are you sure?</p>
                <div className="buttons">
                    <button className="btn btn--no" onClick={onNo}>
                        No
                    </button>
                    <button className="btn" onClick={isProcessingRequired ? () => onYes(setIsSubmitting) : onYes} disabled={isSubmitting}>
                        {isSubmitting ? "Loading..." : "Yes"}
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default AlertModal;
