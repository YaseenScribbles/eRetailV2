import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";

const Login = (props) => {
    const [error, setError] = useState("");
    const { data, setData, processing, post } = useForm({
        email: "",
        password: "",
    })

    const { errors } = props;

    const login = (e) => {
        e.preventDefault();
        try {
            if(JSON.parse(localStorage.getItem("eRetail_user"))){
                localStorage.removeItem("eRetail_user")
            }
            post("/login");
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (errors) {
            if (errors.email) {
                setError(errors.email);
            } else if (errors.password) {
                setError(errors.password);
            } else if (props.message) {
                setError(props.message);
            }
            const timeoutId = setTimeout(() => {
                setError("");
            }, 3000);
            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    return (
        <div className="login">
            <div
                className={`page__loader ${processing ? "loading" : ""}`}
            ></div>
            <div className="login__card">
                <svg className="app-logo">
                    <use xlinkHref="/images/sprite.svg#icon-shopping-bag"></use>
                </svg>
                <h2 className="app-name">eRetail</h2>
                <form onSubmit={login} method="POST" className="login__form">
                    <div className="form__group">
                        <input
                            type="email"
                            className="input"
                            placeholder="Email"
                            name="email"
                            required
                            value={data.email}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                        />
                        <label htmlFor="email" className="label">
                            Email
                        </label>
                    </div>
                    <div className="form__group">
                        <input
                            type="password"
                            className="input"
                            placeholder="Password"
                            name="password"
                            required
                            value={data.password}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                }))
                            }
                        />
                        <label htmlFor="password" className="label">
                            Password
                        </label>
                    </div>
                    <div className="form__group">
                        <button disabled={processing} className="btn btn--login">
                            {processing ? "Loading..." : "Log in"}
                        </button>
                    </div>
                    <p className="error-msg">{error}</p>
                </form>
            </div>
        </div>
    );
};

export default Login;
