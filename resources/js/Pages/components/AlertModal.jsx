import React from "react";

const AlertModal = (props) => {
    return (
        <dialog className="modal" open={props.show}>
            <div className="modal__header">
                <h4>Confirmation</h4>
            </div>
            <div className="modal__body">
                <p>Are you sure?</p>
                <div className="buttons">
                    <button className="btn btn--no" onClick={props.onNo}>
                        No
                    </button>
                    <button className="btn" onClick={props.onYes}>
                        Yes
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default AlertModal;
