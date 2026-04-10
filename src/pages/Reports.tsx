import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, BASE_API } from "../utils/index";

import Button from "../components/Button";
import Card from "../components/Card";

import { MdError } from "react-icons/md";

import type { Report } from "../types";
import { StartNewReportModal } from "../components/StartNewReportModal";

const Reports = () => {
    const navigate = useNavigate();

    const [isStartNewReportModalOpen, setIsStartNewReportModalOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({
        isActive: false,
        type: "error",
        message: "",
    });

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });

        setTimeout(() => {
            setAlert(prev => ({ ...prev, isActive: false }));
        }, 3000);
    };

    const startNewReportHandler = async (startedAt: string, endedAt: string) => {
        if (!startedAt || !endedAt) {
            showAlert("error", "Please complete all the fields");
            return;
        }

        try {
            const response = await fetch(`${BASE_API}/reports`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    startedAt: new Date(startedAt).toISOString(),
                    endedAt: new Date(endedAt).toISOString(),
                }),
            });

            if (response.ok) {
                await response.json();
                showAlert("success", "Report started successfully");
                setIsStartNewReportModalOpen(false);
            } else {
                const error = await response.json();
                setValidationErrors(error.validationErrors);
                showAlert("error", error.message || "Something went wrong");
            }
        } catch (error) {
            if (error instanceof Error) {
                showAlert("error", error.message);
            }
        }
    };

    const closeReportHandler = async (reportId: number) => {
        try {
            const response = await fetch(
                `${BASE_API}/reports/close/${reportId}`,
                {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                }
            );

            if (response.ok) {
                await response.json();

                setReports(prev =>
                    prev.map(r =>
                        r.id === reportId ? { ...r, status: "CLOSED" } : r
                    )
                );

                showAlert("success", "Report closed successfully");
            } else {
                const error = await response.json();
                showAlert("error", error.message || "Something went wrong");
            }
        } catch (error) {
            if (error instanceof Error) {
                showAlert("error", error.message);
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `${BASE_API}/reports`,
                    { headers: getAuthHeaders() }
                );


                console.log(response);

                const data = await response.json();
                setReports(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [alert.type === 'success' && alert.isActive === true]);

    return (
        <div className="w-full h-full space-y-6">

            {/* Modal */}
            {isStartNewReportModalOpen && (
                <StartNewReportModal
                    onClose={() => {
                        setIsStartNewReportModalOpen(false);
                        setValidationErrors(null);
                    }}
                    startNewReport={startNewReportHandler}
                    validationErrors={validationErrors}
                />
            )}

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
                    Reports
                </h2>
                <Button onClickAction={() => setIsStartNewReportModalOpen(true)}>
                    + Start New Report
                </Button>
            </div>

            {/* Reports Grid */}
            {reports.length === 0 ? (
                <div className="text-gray-500 text-sm">
                    No reports yet. Start your first one.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map(report => (
                        <Card
                            key={report.id}
                            type="light"
                            className="relative p-5 cursor-pointer transition duration-200 hover:shadow-xl hover:-translate-y-1"
                            onClickAction={() => {
                                report.status === "OPENED" && (!report.boltUploaded || !report.woltUploaded || !report.glovoUploaded) ?
                                    navigate(`/reports/${report.id}/upload-csv`) :
                                    navigate(`/reports/${report.id}/reports-by-managers`)
                            }}
                        >
                            {/* Date Range */}
                            <div className="text-lg font-semibold mb-3">
                                {new Date(report.startedAt)
                                    .toLocaleDateString("en-GB")
                                    .replace(/\//g, ".")}
                                {" – "}
                                {new Date(report.endedAt)
                                    .toLocaleDateString("en-GB")
                                    .replace(/\//g, ".")}
                            </div>

                            {/* Income */}
                            <div className="text-sm space-y-1 text-gray-600 mb-3">
                                <div>Bolt: {Math.round(report.boltSum)}</div>
                                <div>Wolt: {Math.round(report.woltSum)}</div>
                                <div>Glovo: {Math.round(report.glovoSum)}</div>
                            </div>

                            {/* Totals */}
                            <div className="text-sm space-y-1 text-gray-700 font-medium">
                                <div>Profit: {Math.round(report.profits)}</div>
                                <div>Total Income: {Math.round(report.totalIncome)}</div>
                                <div>Total Outcome: {Math.round(report.totalOutcome)}</div>
                            </div>

                            {/* Status Badge */}
                            <div
                                className={`absolute bottom-4 right-4 px-3 py-1 text-xs rounded-full font-semibold
                                    ${report.status === "OPENED"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {report.status}
                            </div>

                            {/* Close Button */}
                            {report.status === "OPENED" && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeReportHandler(report.id);
                                    }}
                                    className="absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition cursor-pointer"
                                >
                                    Close
                                </button>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
