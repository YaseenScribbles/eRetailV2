import { useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";

const Login = (props) => {
    const [error, setError] = useState("");
    const { data, setData, processing, post } = useForm({
        email: "",
        password: "",
    });

    const { errors } = props;

    const login = (e) => {
        e.preventDefault();
        try {
            if (JSON.parse(localStorage.getItem("eRetail_user"))) {
                localStorage.removeItem("eRetail_user");
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
                <svg
                    className="app-logo"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M19 5h-14l1.5-2h11zM21.794 5.392l-2.994-3.992c-0.196-0.261-0.494-0.399-0.8-0.4h-12c-0.326 0-0.616 0.156-0.8 0.4l-2.994 3.992c-0.043 0.056-0.081 0.117-0.111 0.182-0.065 0.137-0.096 0.283-0.095 0.426v14c0 0.828 0.337 1.58 0.879 2.121s1.293 0.879 2.121 0.879h14c0.828 0 1.58-0.337 2.121-0.879s0.879-1.293 0.879-2.121v-14c0-0.219-0.071-0.422-0.189-0.585-0.004-0.005-0.007-0.010-0.011-0.015zM4 7h16v13c0 0.276-0.111 0.525-0.293 0.707s-0.431 0.293-0.707 0.293h-14c-0.276 0-0.525-0.111-0.707-0.293s-0.293-0.431-0.293-0.707zM15 10c0 0.829-0.335 1.577-0.879 2.121s-1.292 0.879-2.121 0.879-1.577-0.335-2.121-0.879-0.879-1.292-0.879-2.121c0-0.552-0.448-1-1-1s-1 0.448-1 1c0 1.38 0.561 2.632 1.464 3.536s2.156 1.464 3.536 1.464 2.632-0.561 3.536-1.464 1.464-2.156 1.464-3.536c0-0.552-0.448-1-1-1s-1 0.448-1 1z"></path>
                </svg>
                <h2 className="app-name">
                    <span style={{ "--order": "1" }}>e</span>
                    <span style={{ "--order": "2" }}>R</span>
                    <span style={{ "--order": "3" }}>e</span>
                    <span style={{ "--order": "4" }}>t</span>
                    <span style={{ "--order": "5" }}>a</span>
                    <span style={{ "--order": "6" }}>i</span>
                    <span style={{ "--order": "7" }}>l</span>
                </h2>
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
                        <button
                            disabled={processing}
                            className="btn btn--login"
                        >
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
