import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

const Scanner = ({ setBarcode, setErrors, setShowScanner }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        let scanner = new Html5QrcodeScanner("reader", {
            fps: 5,
            qrbox: { width: 500, height: 150 },
            useBarCodeDetectorIfSupported: true,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE,
            ],
            videoConstraints: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        });

        const success = async (result) => {
            await scanner.clear();
            setBarcode(result);
            setShowScanner(false);
        };

        const error = (err) => {
            if (err.message) setErrors((prev) => [...prev, err.message]);
        };

        scanner.render(success, error);

        return () => {
            scanner
                .clear()
                .catch((err) => console.error("Failed to clear scanner", err));
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                scannerRef.current &&
                !scannerRef.current.contains(event.target)
            ) {
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
