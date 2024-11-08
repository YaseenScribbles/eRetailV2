const Toast = ({errors}) => {
    return (
        <div className="toast-container">
            {errors.length > 0 &&
                errors.map((error, index) => (
                    <div key={index} className="toast show">
                        <h5 className="app-name">
                            <svg className="app-icon">
                                <use xlinkHref="/images/sprite.svg#icon-shopping-bag"></use>
                            </svg>
                            eRetail
                        </h5>
                        <p className="message">{error}</p>
                    </div>
                ))}
        </div>
    );
};

export default Toast;
