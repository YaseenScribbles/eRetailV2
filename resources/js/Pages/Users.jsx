import { useForm } from "@inertiajs/react";
import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import Grid from "./components/Grid";
import Toast from "./components/Toast";
import ReactSelect from "react-select";
import MobileNav from "./components/MobileNav";

const roles = [
    {
        label: "Administrator",
        value: "admin",
    },

    {
        label: "User",
        value: "user",
    },
];

const reportOptions = [
    {
        label: "ALL",
        value: "ALL",
    },
    {
        label: "ESSA",
        value: "ESSA",
    },
    {
        label: "FRANCHISE",
        value: "FRANCHISE",
    },
];

const Users = (props) => {
    const { data, setData, processing, post, put } = useForm({
        name: "",
        email: "",
        mobile: "",
        password: "",
        password_confirmation: "",
        role: "",
        shops: "",
        buyer_id: "",
        sale_report: "",
        has_invoice_report: false,
    });

    const [shops, setShops] = useState([]);
    const [buyers, setBuyers] = useState([]);

    const [selectedShops, setSelectedShops] = useState([]);
    const [selectedBuyers, setSelectedBuyers] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 4,
    });
    const [tableData, setTableData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState();
    const columnHelper = createColumnHelper();
    const [showMobileNav, setShowMobileNav] = useState(false);

    const columns = [
        columnHelper.accessor("name", {
            header: "Name",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("email", {
            header: "Email",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("role", {
            header: "Role",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("has_invoice_report", {
            header: "Invoice Report",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("sale_report", {
            header: "Sale Report",
            cell: (info) => info.getValue(),
        }),
        {
            id: "edit",
            header: () => null,
            cell: ({ row }) => {
                return (
                    <button
                        className="btn btn--edit"
                        onClick={() => updateForm(row.original)}
                    >
                        <svg className="edit-icon">
                            <use xlinkHref="/images/sprite.svg#icon-new-message"></use>
                        </svg>
                    </button>
                );
            },
            enableSorting: false,
        },
    ];
    const table = useReactTable({
        data: tableData,
        columns: columns,
        state: {
            sorting,
            globalFilter,
            pagination,
        },

        getCoreRowModel: getCoreRowModel(),

        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),

        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),

        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleChange = (e) => {
        const key = e.target.name;
        const value = e.target.value;

        setData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateForm = (data) => {
        const selectedShopValues = data.shops.split(","); // Create an array of shop values from data.shops

        const selectedShops = shops.filter((shop) =>
            selectedShopValues.includes(shop.value)
        );
        setSelectedShops(selectedShops);

        const selectedBuyerValues = data.buyer_id ? data.buyer_id.split(",") : ""; // Create an array of shop values from data.shops

        const selectedBuyers = buyers.filter((buyer) =>
            selectedBuyerValues.includes(buyer.value)
        );
        setSelectedBuyers(selectedBuyers);

        const selectedRole = roles.filter(
            (role) => role.value.toUpperCase() == data.role
        );
        setSelectedRole(selectedRole[0]);

        const selectedReport = reportOptions.filter(
            (report) => report.value == data.sale_report
        );
        setSelectedReport(selectedReport[0]);

        setData((prev) => ({
            ...prev,
            name: data.name,
            email: data.email,
            mobile: data.mobile || "",
            has_invoice_report: data.has_invoice_report == "YES" ? true : false,
        }));

        setEditId(data.id);
        setEditMode(true);
    };

    const addError = (error) => {
        setErrors((prev) => [...prev, error]);
    };

    const saveUser = (e) => {
        e.preventDefault();
        let isValid = true;
        if (data.name === "") {
            addError("Please fill the name");
            isValid = false;
        }
        if (data.email === "") {
            addError("Please fill the email");
            isValid = false;
        }
        if (data.password === "") {
            addError("Please fill the password");
            isValid = false;
        }
        if (data.password_confirmation === "") {
            addError("Please fill the confirm password");
            isValid = false;
        }
        if (data.role === "") {
            addError("Please select the role");
            isValid = false;
        }
        if (data.shops === "") {
            addError("Please select the shops");
            isValid = false;
        }
        //Buyer is not required for all users
        // if (data.buyer_id === "") {
        //     addError("Please select the buyers");
        //     isValid = false;
        // }
        if (data.sale_report === "") {
            addError("Please select the sale report");
            isValid = false;
        }

        if (!isValid) return;

        post("/users", {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setErrors(["User added successfully"]);
            },
        });
    };

    const updateUser = (e) => {
        e.preventDefault();
        let isValid = true;
        if (data.name === "") {
            addError("Please fill the name");
            isValid = false;
        }
        if (data.email === "") {
            addError("Please fill the email");
            isValid = false;
        }
        if (data.role === "") {
            addError("Please select the role");
            isValid = false;
        }
        if (data.shops === "") {
            addError("Please select the shops");
            isValid = false;
        }
        //Buyer is not required for all users
        // if (data.buyer_id === "") {
        //     addError("Please select the buyers");
        //     isValid = false;
        // }
        if (data.sale_report === "") {
            addError("Please select the sale report");
            isValid = false;
        }

        if (!isValid) return;

        const updatedData = { ...data };
        if (!updatedData.password) delete updatedData.password;
        if (!updatedData.password_confirmation)
            delete updatedData.password_confirmation;

        put(`/users/${editId}`, {
            ...updatedData,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
                setErrors(["User updated successfully"]);
            },
        });
    };

    const resetForm = () => {
        setData({
            name: "",
            email: "",
            mobile: "",
            password: "",
            password_confirmation: "",
            role: "",
            shops: "",
            buyer_id: "",
            sale_report: "",
            has_invoice_report: false,
        });
        setSelectedBuyers([]);
        setSelectedShops([]);
        setSelectedRole(null);
        setSelectedReport(null);
        setEditId();
        setEditMode(false);
    };

    useEffect(() => {
        if (props.shops.length > 0) {
            const shops = props.shops.map((shop) => ({
                label: shop.shopname,
                value: shop.shopid,
            }));
            setShops(shops);
        }
        if (props.buyers.length > 0) {
            const buyers = props.buyers.map((buyer) => ({
                label: buyer.name,
                value: buyer.id,
            }));
            setBuyers(buyers);
        }
        if (props.users.length > 0) {
            const users = props.users.map((user) => ({
                ...user,
                name: user.name.toUpperCase(),
                role: user.role.toUpperCase(),
                has_invoice_report: user.has_invoice_report == 1 ? "YES" : "NO",
            }));
            setTableData(users);
        }
        if (props.errors) {
            const errors = Object.values(props.errors);
            setErrors((prev) => [...prev, ...errors]);
        }
    }, [props]);

    useEffect(() => {
        if (errors.length > 0) {
            const timeoutId = setTimeout(() => {
                setErrors((prev) => prev.slice(1)); // Remove the first error
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [errors]);

    useEffect(() => {
        const shops =
            selectedShops.length > 0
                ? selectedShops.map((shop) => shop.value).join(",")
                : "";
        setData((prev) => ({ ...prev, shops: shops }));
    }, [selectedShops]);

    useEffect(() => {
        const buyers =
            selectedBuyers.length > 0
                ? selectedBuyers.map((buyer) => buyer.value).join(",")
                : "";
        setData((prev) => ({ ...prev, buyer_id: buyers }));
    }, [selectedBuyers]);

    useEffect(() => {
        const role = selectedRole ? selectedRole.value : "";
        setData((prev) => ({ ...prev, role: role }));
    }, [selectedRole]);

    useEffect(() => {
        const report = selectedReport ? selectedReport.value : "";
        setData((prev) => ({ ...prev, sale_report: report }));
    }, [selectedReport]);

    return (
        <>
            <Navbar />
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
            <div className="page users">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Users</h3>
                    <label
                        className="edit"
                        style={editMode ? { opacity: "1" } : {}}
                        htmlFor=""
                    >
                        &nbsp; Edit Mode &nbsp;{" "}
                        <span onClick={resetForm}>X</span>
                    </label>
                </div>
                <form
                    action="/users"
                    className="page__form"
                    method="post"
                    onSubmit={editMode ? updateUser : saveUser}
                >
                    <div className="form__group">
                        <input
                            type="text"
                            className="input"
                            placeholder="Name"
                            name="name"
                            value={data.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form__group">
                        <input
                            type="email"
                            className="input"
                            placeholder="Email"
                            name="email"
                            value={data.email}
                            onChange={handleChange}
                        />
                    </div>
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
                        <input
                            type="password"
                            className="input"
                            placeholder="Password"
                            name="password"
                            value={data.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form__group">
                        <input
                            type="password"
                            className="input"
                            placeholder="Confirm Password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            placeholder="Role"
                            options={roles}
                            onChange={(e) => setSelectedRole(e)}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                            value={selectedRole}
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            placeholder="Shops"
                            options={shops}
                            onChange={(e) => setSelectedShops(e)}
                            value={selectedShops}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                            isMulti
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            placeholder="Buyers"
                            options={buyers}
                            onChange={(e) => setSelectedBuyers(e)}
                            value={selectedBuyers}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                            isMulti
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            placeholder="Sale Report"
                            options={reportOptions}
                            onChange={(e) => setSelectedReport(e)}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary75: "#638663",
                                    primary50: "#638663",
                                    primary25: "#638663",
                                    primary: "#638663",
                                },
                            })}
                            value={selectedReport}
                        />
                    </div>
                    <div className="form__group">
                        <input
                            type="checkbox"
                            name="has_invoice_report"
                            id="has_invoice_report"
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    has_invoice_report: e.target.checked
                                        ? true
                                        : false,
                                }))
                            }
                            className="checkbox"
                            checked={data.has_invoice_report}
                        />
                        <label htmlFor="has_invoice_report">
                            <div className="custom-checkbox">
                                <svg className="check-icon">
                                    <use xlinkHref="/images/sprite.svg#icon-check"></use>
                                </svg>
                            </div>
                            Invoice Report
                        </label>
                    </div>
                    <div className="form__group">
                        <button className="btn" disabled={processing}>{`${
                            editMode ? "Update" : "Save"
                        }`}</button>
                    </div>
                </form>
                {tableData.length > 0 && (
                    <Grid
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        table={table}
                        tableData={tableData}
                        reportName={"Users"}
                        footerRequired={false}
                        excludeSortingColumns={["edit"]}
                    />
                )}
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default Users;
