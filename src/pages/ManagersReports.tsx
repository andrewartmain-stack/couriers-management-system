import { useState, useEffect } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { getAuthHeaders, BASE_API } from "../utils/index";

import Button from "../components/Button";
import Card from "../components/Card";

import { MdError } from "react-icons/md";

import type { ReportByManager, Manager } from "../types";

const ManagerReports = () => {
    const [reports, setReports] = useState<ReportByManager[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({
        isActive: false,
        type: "error",
        message: "",
    });

    const { reportId } = useParams();
    const navigate = useNavigate();

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });

        setTimeout(() => {
            setAlert(prev => ({ ...prev, isActive: false }));
        }, 3000);
    };

    const getManagerFullName = (id: number) => {
        const manager = managers.find(m => m.id === id);
        return manager ? `${manager.firstname} ${manager.lastname}` : "Unknown";
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const reportsResponse = await fetch(
                    `${BASE_API}/manager-reports/report/${reportId}`,
                    { headers: getAuthHeaders() }
                );

                const managersResponse = await fetch(
                    "${BASE_API}/managers",
                    { headers: getAuthHeaders() }
                );

                const reportsData = await reportsResponse.json();
                const managersData = await managersResponse.json();

                setReports(reportsData);
                setManagers(managersData);
            } catch (error) {
                if (error instanceof Error) {
                    showAlert("error", error.message);
                }
            }
        };

        fetchData();
    }, [reportId]);

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
                    Reports by Manager
                </h2>
                <Button onClickAction={() => navigate(-1)}>
                    Back
                </Button>
            </div>

            {/* Empty state */}
            {reports.length === 0 ? (
                <div className="text-gray-500 text-sm">
                    No manager reports found.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map(report => (
                        <NavLink
                            key={report.id}
                            to={`/reports/${report.reportId}/reports-by-managers/${report.id}?managerName=${getManagerFullName(report.managerId)}`}
                        >
                            <Card
                                type="light"
                                className="relative p-5 transition duration-200 hover:shadow-xl hover:-translate-y-1"
                            >
                                {/* Manager Name */}
                                <div className="text-lg font-semibold mb-4">
                                    {getManagerFullName(report.managerId)}
                                </div>

                                {/* Platforms */}
                                <div className="space-y-3 text-sm text-gray-700">

                                    <div>
                                        <div className="font-medium text-gray-500">Bolt</div>
                                        <div className="flex justify-between">
                                            <span>Before</span>
                                            <span>{report.boltBefore}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>After</span>
                                            <span>{report.boltAfter}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-gray-500">Wolt</div>
                                        <div className="flex justify-between">
                                            <span>Before</span>
                                            <span>{report.woltBefore}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>After</span>
                                            <span>{report.woltAfter}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-gray-500">Glovo</div>
                                        <div className="flex justify-between">
                                            <span>Before</span>
                                            <span>{report.glovoBefore}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>After</span>
                                            <span>{report.glovoAfter}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Highlight section */}
                                <div className="mt-5 pt-4 border-t text-sm">
                                    <div className="flex justify-between font-medium">
                                        <span>Total Payout</span>
                                        <span>{report.totalPayout}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Manager Commission</span>
                                        <span>{report.totalManagerCommission}</span>
                                    </div>
                                </div>

                            </Card>
                        </NavLink>
                    ))}
                    <NavLink
                        key={1001}
                        to={`/reports/${reportId}/unassigned-records`}
                    >
                        <Card
                            type="dark"
                            className="relative p-5 transition duration-200 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="w-full h-full flex justify-center items-center">
                                <h2 className="text-2xl font-semibold">Unassigned Accounts</h2>
                            </div>
                        </Card>
                    </NavLink>
                </div>
            )}
        </div>
    );
};

export default ManagerReports;
