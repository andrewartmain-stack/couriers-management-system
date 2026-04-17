import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getAuthHeaders, BASE_API } from '../utils/index';
import Spinner from '../components/Spinner';
import Card from '../components/Card';
import type { Report, ReportByManager } from '../types';

const MyReports = () => {
    const [myReports, setMyReports] = useState<Array<{ report: Report; managerReport: ReportByManager }>>([]);
    const [loading, setLoading] = useState(true);

    const username = localStorage.getItem('username') ?? '';
    const storedManagerId = localStorage.getItem('manager_id');
    const myManagerId = storedManagerId ? Number(storedManagerId) : null;

    useEffect(() => {
        if (!myManagerId) { setLoading(false); return; }

        const fetchReports = async () => {
            try {
                const res = await fetch(`${BASE_API}/reports`, { headers: getAuthHeaders() });
                const reports: Report[] = await res.json();
                const sorted = [...reports].sort((a, b) =>
                    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
                );

                const results = await Promise.all(
                    sorted.map(async (report) => {
                        const mrRes = await fetch(`${BASE_API}/manager-reports/report/${report.id}`, { headers: getAuthHeaders() });
                        const mrs: ReportByManager[] = await mrRes.json();
                        const mine = mrs.find(mr => mr.managerId === myManagerId);
                        return mine ? { report, managerReport: mine } : null;
                    })
                );

                setMyReports(results.filter(Boolean) as Array<{ report: Report; managerReport: ReportByManager }>);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [myManagerId]);

    if (loading) return <div className="flex justify-center mt-20"><Spinner size={10} /></div>;

    return (
        <div className="flex flex-col gap-6 min-h-screen">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">My Reports</h1>
                <p className="text-sm text-gray-400 mt-1">Reports associated with your account.</p>
            </div>

            {myReports.length === 0 ? (
                <p className="text-sm text-gray-400">No reports found for your account.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myReports.map(({ report, managerReport }) => (
                        <NavLink
                            key={managerReport.id}
                            to={`/reports/${report.id}/reports-by-managers/${managerReport.id}?managerName=${encodeURIComponent(username)}`}
                        >
                            <Card type="light" className="relative p-5 transition duration-200 hover:shadow-xl hover:-translate-y-1">
                                <div className="text-base font-semibold mb-4">
                                    {new Date(report.startedAt).toLocaleDateString('en-GB').replace(/\//g, '.')}
                                    {' – '}
                                    {new Date(report.endedAt).toLocaleDateString('en-GB').replace(/\//g, '.')}
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    {[
                                        { label: 'Bolt', before: managerReport.boltBefore, after: managerReport.boltAfter },
                                        { label: 'Wolt', before: managerReport.woltBefore, after: managerReport.woltAfter },
                                        { label: 'Glovo', before: managerReport.glovoBefore, after: managerReport.glovoAfter },
                                    ].map(({ label, before, after }) => (
                                        <div key={label}>
                                            <div className="font-medium text-gray-500 mb-0.5">{label}</div>
                                            <div className="flex justify-between"><span>Before</span><span>{before}</span></div>
                                            <div className="flex justify-between"><span>After</span><span>{after}</span></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t text-sm">
                                    <div className="flex justify-between font-medium">
                                        <span>Total Payout</span>
                                        <span>lei {managerReport.totalPayout.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>My Commission</span>
                                        <span>lei {managerReport.totalManagerCommission.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReports;
