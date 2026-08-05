import { ShoppingBag } from "lucide-react";

const Toast = ({errors}) => {
    return (
        <div className="toast-container">
            {errors.length > 0 &&
                errors.map((error, index) => (
                    <div key={index} className="toast show">
                        <h5 className="app-name">
                            <ShoppingBag className="app-icon" />
                            eRetail
                        </h5>
                        <p className="message">{error}</p>
                    </div>
                ))}
        </div>
    );
};

export default Toast;
