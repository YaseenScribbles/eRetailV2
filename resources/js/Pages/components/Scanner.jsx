import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const Scanner = ({ setBarcode, setErrors, setShowScanner }) => {

    const scannerRef = useRef(null)

    useEffect(() => {
        let scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 350, height: 350 },
            },
            false
        );

        const success = async (result) => {
            await scanner.clear();
            setBarcode(result);
            setShowScanner(false)
        };

        const error = (err) => {
            console.warn(err);
        };

        scanner.render(success, error);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (scannerRef.current && !scannerRef.current.contains(event.target)) {
                setShowScanner(false); // Close scanner on outside click
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside); // Cleanup
        };
    }, [setShowScanner]);

    return (
        <div className="scanner" ref={scannerRef}>
            <div id="reader"></div>
        </div>
    );
};

export default Scanner;
