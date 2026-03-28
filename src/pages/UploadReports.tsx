import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthHeaders, getAuthHeadersNoContentType } from "../utils/index";
import Card from "../components/Card";
import { MdError, MdCheckCircle, MdUploadFile } from "react-icons/md";

import logoBolt from "../../public/bolt-1.svg";
import logoWolt from '../../public/idcxOwdB80_1769177945180.jpeg';
import logoGlovo from '../../public/idgSGGe-zp_1769177931923.jpeg';
import type { Report } from "../types";
import Button from "../components/Button";

const UploadReports = () => {
    const [alert, setAlert] = useState<{ isActive: boolean; type: "error" | "success"; message: string }>({
        isActive: false,
        type: "error",
        message: "",
    });
    const [loading, setLoading] = useState({
        bolt: false,
        wolt: false,
        glovo: false
    });
    const [report, setReport] = useState<Report | null>(null);
    const [selectedBoltFile, setSelectedBoltFile] = useState<File | null>(null);
    const [selectedWoltFile, setSelectedWoltFile] = useState<File | null>(null);
    const [selectedGlovoFile, setSelectedGlovoFile] = useState<File | null>(null);

    const { reportId } = useParams();
    const navigate = useNavigate()

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });
        setTimeout(() => setAlert(prev => ({ ...prev, isActive: false })), 3000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (value: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type
            if (!file.name.endsWith('.csv')) {
                showAlert("error", "Please select a CSV file");
                setFile(null);
                return;
            }

            console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
            setFile(file);
        } else {
            setFile(null);
        }
    };

    const handleUpload = async (platformName: 'bolt' | 'wolt' | 'glovo', file: File | null, setFile: (value: File | null) => void) => {
        if (!file) {
            showAlert("error", "Please select a file first");
            return;
        }

        if (!reportId) {
            showAlert("error", "Report ID is missing");
            return;
        }

        // Parse reportId as number
        const reportIdNumber = parseInt(reportId, 10);
        if (isNaN(reportIdNumber)) {
            showAlert("error", "Invalid Report ID");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("reportId", reportIdNumber.toString());

        console.log("Uploading file:", {
            fileName: file.name,
            fileSize: file.size,
            reportId: reportIdNumber,
            platformId: platformName
        });

        setLoading(prev => ({ ...prev, [platformName]: true }));

        try {
            const res = await fetch(`https://99c3-109-166-138-69.ngrok-free.app/api/reports/csv/upload/${platformName}`, {
                method: "POST",
                headers: getAuthHeadersNoContentType(),
                body: formData,
            });

            console.log("Response status:", res.status);

            // Try to get response text first
            const responseText = await res.text();
            console.log("Response text:", responseText);

            if (!res.ok) {
                let errorMessage = `Upload failed with status ${res.status}`;

                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                    console.error("Error data:", errorData);
                } catch (e) {
                    // Response is not JSON
                    errorMessage = responseText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                result = { message: "Upload successful" };
            }

            console.log("Upload result:", result);

            showAlert("success", result.message || "CSV uploaded and processed successfully!");
            setFile(null);

            // Reset file input
            const fileInput = document.getElementById(`${platformName}-file`) as HTMLInputElement;
            if (fileInput) fileInput.value = "";

            // Refresh report data
            await fetchReportData();

        } catch (err) {
            console.error("Upload error:", err);
            showAlert("error", (err as Error).message || "Failed to upload file");
        } finally {
            setLoading(prev => ({ ...prev, [platformName]: false }));
        }
    };

    const isUserAllowedToGoNext = () => {
        return (report?.boltUploaded || report?.woltUploaded || report?.glovoUploaded) ? true : false
    }

    const fetchReportData = async () => {
        try {
            const response = await fetch(
                `https://99c3-109-166-138-69.ngrok-free.app/api/reports/${reportId}`,
                { headers: getAuthHeaders() }
            );

            const data = await response.json();
            setReport(data);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
                showAlert("error", error.message);
            }
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [])

    return (
        <div className="w-full min-h-screen space-y-6">
            {/* Alert */}
            {alert.isActive && (
                <div className={`
                fixed top-5 right-5 z-100
                max-w-sm w-full
                            ${alert.type === "error" ? "bg-[var(--error-bg)] text-[var(--error-text)]" : "bg-green-100 text-green-700"}
                shadow-xl
                rounded-2xl p-4
                animate-toast
              `}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 text-lg ${alert.type === "error" ? "text-red-500" : "text-green-500"}`}>
                            <MdError />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-semibold leading-snug">
                                {alert.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold tracking-tight">
                    Upload Reports
                </h2>
                <Button onClickAction={() => navigate(-1)}>
                    Back
                </Button>
            </div>

            {/* Debug Info */}
            {reportId && (
                <div className="text-xs text-gray-500">
                    Report ID: <span className="font-mono">{reportId}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Bolt Card */}
                <Card
                    type="light"
                    className="p-6 transition duration-200 hover:shadow-xl hover:-translate-y-1 border border-gray-100 bg-green-50 hover:bg-green-100 flex flex-col items-center"
                >
                    <img src={logoBolt} alt="Bolt logo" className="w-14 h-14 object-contain rounded-xl mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">Bolt</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4 text-center">Upload CSV report from Bolt platform</p>

                    {/* File input styled */}
                    <label
                        htmlFor="bolt-file"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition ${selectedBoltFile
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 hover:border-gray-500"
                            } ${loading.bolt ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <MdUploadFile className={`text-3xl mb-2 ${selectedBoltFile ? "text-green-600" : "text-gray-500"}`} />
                        <span className="text-sm text-center px-2 text-gray-600">
                            {selectedBoltFile ? selectedBoltFile.name : "Choose CSV file"}
                        </span>
                        {selectedBoltFile && (
                            <span className="text-xs text-gray-400 mt-1">
                                {(selectedBoltFile.size / 1024).toFixed(2)} KB
                            </span>
                        )}
                    </label>
                    <input
                        type="file"
                        id="bolt-file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSelectedBoltFile)}
                        disabled={loading.bolt}
                    />

                    <button
                        onClick={() => handleUpload("bolt", selectedBoltFile, setSelectedBoltFile)}
                        disabled={!selectedBoltFile || loading.bolt}
                        className={`mt-4 px-6 py-2 rounded-lg text-white font-medium transition ${selectedBoltFile && !loading.bolt
                            ? "bg-green-600 hover:bg-green-700 active:scale-95"
                            : "bg-green-300 cursor-not-allowed"
                            }`}
                    >
                        {loading.bolt ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : "Upload CSV"}
                    </button>

                    {/* Upload Status */}
                    {report?.boltUploaded && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                            <MdCheckCircle size={18} />
                            <span className="text-xs font-medium">Uploaded</span>
                        </div>
                    )}
                </Card>

                {/* Wolt Card */}
                <Card
                    type="light"
                    className="p-6 transition duration-200 hover:shadow-xl hover:-translate-y-1 border border-gray-100 bg-blue-50 hover:bg-blue-100 flex flex-col items-center"
                >
                    <img src={logoWolt} alt="Wolt logo" className="w-14 h-14 object-contain rounded-xl mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">Wolt</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4 text-center">Upload CSV report from Wolt platform</p>

                    {/* File input styled */}
                    <label
                        htmlFor="wolt-file"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition ${selectedWoltFile
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-500"
                            } ${loading.wolt ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <MdUploadFile className={`text-3xl mb-2 ${selectedWoltFile ? "text-blue-600" : "text-gray-500"}`} />
                        <span className="text-sm text-center px-2 text-gray-600">
                            {selectedWoltFile ? selectedWoltFile.name : "Choose CSV file"}
                        </span>
                        {selectedWoltFile && (
                            <span className="text-xs text-gray-400 mt-1">
                                {(selectedWoltFile.size / 1024).toFixed(2)} KB
                            </span>
                        )}
                    </label>
                    <input
                        type="file"
                        id="wolt-file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSelectedWoltFile)}
                        disabled={loading.wolt}
                    />

                    <button
                        onClick={() => handleUpload("wolt", selectedWoltFile, setSelectedWoltFile)}
                        disabled={!selectedWoltFile || loading.wolt}
                        className={`mt-4 px-6 py-2 rounded-lg text-white font-medium transition ${selectedWoltFile && !loading.wolt
                            ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                            : "bg-blue-300 cursor-not-allowed"
                            }`}
                    >
                        {loading.wolt ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : "Upload CSV"}
                    </button>

                    {/* Upload Status */}
                    {report?.woltUploaded && (
                        <div className="mt-3 flex items-center gap-2 text-blue-600">
                            <MdCheckCircle size={18} />
                            <span className="text-xs font-medium">Uploaded</span>
                        </div>
                    )}
                </Card>

                {/* Glovo Card */}
                <Card
                    type="light"
                    className="p-6 transition duration-200 hover:shadow-xl hover:-translate-y-1 border border-gray-100 bg-yellow-50 hover:bg-yellow-100 flex flex-col items-center"
                >
                    <img src={logoGlovo} alt="Glovo logo" className="w-14 h-14 object-contain rounded-xl mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">Glovo</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4 text-center">Upload CSV report from Glovo platform</p>

                    {/* File input styled */}
                    <label
                        htmlFor="glovo-file"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg transition ${selectedGlovoFile
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-300 hover:border-gray-500"
                            } ${loading.glovo ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <MdUploadFile className={`text-3xl mb-2 ${selectedGlovoFile ? "text-yellow-600" : "text-gray-500"}`} />
                        <span className="text-sm text-center px-2 text-gray-600">
                            {selectedGlovoFile ? selectedGlovoFile.name : "Choose CSV file"}
                        </span>
                        {selectedGlovoFile && (
                            <span className="text-xs text-gray-400 mt-1">
                                {(selectedGlovoFile.size / 1024).toFixed(2)} KB
                            </span>
                        )}
                    </label>
                    <input
                        type="file"
                        id="glovo-file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setSelectedGlovoFile)}
                        disabled={loading.glovo}
                    />

                    <button
                        onClick={() => handleUpload("glovo", selectedGlovoFile, setSelectedGlovoFile)}
                        disabled={!selectedGlovoFile || loading.glovo}
                        className={`mt-4 px-6 py-2 rounded-lg text-white font-medium transition ${selectedGlovoFile && !loading.glovo
                            ? "bg-yellow-600 hover:bg-yellow-700 active:scale-95"
                            : "bg-yellow-300 cursor-not-allowed"
                            }`}
                    >
                        {loading.glovo ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : "Upload CSV"}
                    </button>

                    {/* Upload Status */}
                    {report?.glovoUploaded && (
                        <div className="mt-3 flex items-center gap-2 text-yellow-600">
                            <MdCheckCircle size={18} />
                            <span className="text-xs font-medium">Uploaded</span>
                        </div>
                    )}
                </Card>
            </div>

            <div className="fixed bottom-10 right-10">
                <Button type="success" disabled={!isUserAllowedToGoNext()} onClickAction={() => navigate(`/reports/${reportId}/reports-by-managers`)}>
                    Go to Manager Reports
                </Button>
            </div>
        </div>
    );
};

export default UploadReports;