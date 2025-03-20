import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import { useForm } from "@inertiajs/react";
import ReactSelect from "react-select";
import SmsModal from "./components/SmsModal";
import Toast from "./components/Toast";
import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import Grid from "./components/Grid";
import AlertModal from "./components/AlertModal";

const SMS = (props) => {
    const [showMobileNav, setShowMobileNav] = useState(false);
    const { data, setData, processing, post } = useForm({
        template: "",
        shop_id: "",
        message: "",
        template_purpose: "",
    });
    const [templateOptions, setTemplateOptions] = useState([]);
    const [shopOptions, setShopOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [errors, setErrors] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const [tableData, setTableData] = useState([]);
    const columnHelper = createColumnHelper();
    const [message, setMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

    const columns = [
        columnHelper.accessor("s_no", {
            header: "S No",
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("date", {
            header: "Date",
        }),
        columnHelper.accessor("shopname", {
            header: "Shop",
        }),
        columnHelper.accessor("template", {
            header: "Template",
        }),
        columnHelper.accessor("user", {
            header: "User",
        }),
        columnHelper.accessor("total", {
            header: "Customers",
        }),
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

    const sendSms = async () => {
        setShowAlert(false);
        if (!message) {
            addError("Message not updated");
            return;
        }
        post("/sms", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                addError("Sms sent successfully");
            },
        });
    };

    const addError = (error) => {
        setErrors((prev) => [...prev, error]);
    };

    useEffect(() => {
        if (props) {
            const shops = props.shops.map((shop) => ({
                label: shop.shopname,
                value: shop.shopid,
            }));
            setShopOptions(shops);

            const templates = props.templates.map((template) => ({
                label: template.purpose,
                value: template.template,
            }));
            setTemplateOptions(templates);

            setTableData(props.sms);
        }

        if (props.errors) {
            const errors = Object.values(props.errors);
            setErrors((prev) => [...prev, ...errors]);
        }

        if (props.message) {
            setMessage(props.message);
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
        if (selectedTemplate) {
            setData((p) => ({
                ...p,
                template: selectedTemplate.value,
                template_purpose: selectedTemplate.label,
            }));
        }
    }, [selectedTemplate]);

    useEffect(() => {
        setData((p) => ({
            ...p,
            message: message,
        }));
    }, [message]);

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
            <div className="page sms">
                <div
                    className={`page__loader ${processing ? "loading" : ""}`}
                ></div>
                <div className="page__title">
                    <h3>Promotion</h3>
                </div>
                <div className="page__form">
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            options={templateOptions}
                            value={selectedTemplate}
                            placeholder="Templates"
                            onChange={(e) => setSelectedTemplate(e)}
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
                        />
                    </div>
                    <div className="form__group">
                        <ReactSelect
                            className="select"
                            options={shopOptions}
                            placeholder="Shops"
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    shop_id: e.value,
                                }))
                            }
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
                        ></ReactSelect>
                    </div>
                    <div className="form__group">
                        <button
                            disabled={processing}
                            type="button"
                            className="btn"
                            onClick={() => {
                                if (!message) {
                                    addError("Bulk message is not updated");
                                    return;
                                }
                                if (!data.shop_id) {
                                    addError("Please select the shop");
                                    return;
                                }
                                setShowAlert(true);
                            }}
                        >
                            Send
                        </button>
                    </div>
                    <div className="form__group">
                        <button
                            onClick={() => {
                                if (!data.template) {
                                    addError("Please select the template");
                                    return;
                                }
                                if (!data.shop_id) {
                                    addError("Please select the shop");
                                    return;
                                }
                                setShowModal(true);
                            }}
                            disabled={processing}
                            type="button"
                            className="btn"
                        >
                            Test
                        </button>
                    </div>
                </div>

                <Grid
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    table={table}
                    tableData={tableData}
                    reportName={"Promotion Report"}
                    footerRequired={false}
                />
                <SmsModal
                    mobile="8870844411"
                    template={data.template}
                    show={showModal}
                    setShow={setShowModal}
                    addError={addError}
                    message={message}
                    setMessage={setMessage}
                />
                <AlertModal
                    show={showAlert}
                    onYes={sendSms}
                    onNo={() => setShowAlert(false)}
                />
                <Toast errors={errors} />
            </div>
        </>
    );
};

export default SMS;
