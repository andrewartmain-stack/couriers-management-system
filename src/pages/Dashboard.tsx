import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { AddCourierModal } from "../components/AddCourierModal";
import Button from "../components/Button";
import Card from "../components/Card";
import { LineChart } from "../components/LineChart";
import Spinner from "../components/Spinner";
import { MdOutlineDeliveryDining, MdError } from "react-icons/md";
import { FaHandSparkles } from "react-icons/fa";
import { GrUserManager } from "react-icons/gr";
import { FaTag } from "react-icons/fa6";
import { FaCity } from "react-icons/fa";
import logoBolt from '../../public/bolt-1.svg';
import logoWolt from '../../public/idcxOwdB80_1769177945180.jpeg';
import logoGlovo from '../../public/idgSGGe-zp_1769177931923.jpeg';
import { AddManagerModal } from "../components/AddManagerModal";
import { AddTagModal } from "../components/AddTagModal";
import { AddCityModal } from "../components/AddCityModal";
import { useAppData } from '../context/AppContext';
import { getAuthHeaders, BASE_API } from '../utils/index';
import type { Report, ReportByManager } from '../types';

const PLATFORM_COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Bolt=green, Wolt=blue, Glovo=yellow
const CITY_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const getISOWeekKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${year}-${String(week).padStart(2, '0')}`;
};

const Dashboard = () => {
    const { couriers, cities, accounts, managers, tags, loading, refresh } = useAppData();
    const isAdmin = localStorage.getItem('user_role') === 'ROLE_ADMIN';

    const [reports, setReports] = useState<Report[]>([]);
    const [managerReports, setManagerReports] = useState<ReportByManager[]>([]);
    const [prevManagerReports, setPrevManagerReports] = useState<ReportByManager[]>([]);
    const [chartsLoading, setChartsLoading] = useState(true);

    const [isAddCourierModalOpen, setIsAddCourierModalOpen] = useState(false);
    const [isAddManagerModalOpen, setIsAddManagerModalOpen] = useState(false);
    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch(`${BASE_API}/reports`, { headers: getAuthHeaders() });
                const data: Report[] = await res.json();
                const sorted = [...data].sort((a, b) =>
                    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
                );
                setReports(sorted);

                const [last, prev] = [sorted[sorted.length - 1], sorted[sorted.length - 2]];

                const [lastMR, prevMR] = await Promise.all([
                    last ? fetch(`${BASE_API}/manager-reports/report/${last.id}`, { headers: getAuthHeaders() }).then(r => r.json()) : Promise.resolve([]),
                    prev ? fetch(`${BASE_API}/manager-reports/report/${prev.id}`, { headers: getAuthHeaders() }).then(r => r.json()) : Promise.resolve([]),
                ]);

                setManagerReports(lastMR);
                setPrevManagerReports(prevMR);
            } catch (e) {
                console.error(e);
            } finally {
                setChartsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const sortedReports = useMemo(() =>
        [...reports].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
        [reports]
    );

    const reportLabels = useMemo(() =>
        sortedReports.map(r =>
            new Date(r.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        ),
        [sortedReports]
    );

    const revenueChartData = useMemo(() => {
        const zeros = Array(sortedReports.length).fill(0);
        return [
            { key: 'boltSum' as const, label: 'Bolt', color: PLATFORM_COLORS[0] },
            { key: 'woltSum' as const, label: 'Wolt', color: PLATFORM_COLORS[1] },
            { key: 'glovoSum' as const, label: 'Glovo', color: PLATFORM_COLORS[2] },
        ].map(({ key, label, color }) => ({
            city: label,
            currentYearData: sortedReports.map(r => r[key]),
            previousYearData: zeros,
            color,
        }));
    }, [sortedReports]);

    const { courierChartData, courierLabels } = useMemo(() => {
        if (couriers.length === 0 || cities.length === 0)
            return { courierChartData: [], courierLabels: [] };

        // Build a sorted list of unique year-week keys from all couriers
        const weekMeta = new Map<string, { label: string; counts: Record<number, number> }>();
        couriers.forEach(c => {
            const date = new Date(c.createdAt);
            const key = getISOWeekKey(date);
            if (!weekMeta.has(key)) {
                weekMeta.set(key, {
                    label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    counts: {},
                });
            }
            const entry = weekMeta.get(key)!;
            entry.counts[c.cityId] = (entry.counts[c.cityId] ?? 0) + 1;
        });

        const sorted = [...weekMeta.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        const labels = sorted.map(([, v]) => v.label);
        const zeros = Array(sorted.length).fill(0);

        const data = cities.slice(0, 6).map((city, i) => ({
            city: city.name,
            currentYearData: sorted.map(([, v]) => v.counts[city.id] ?? 0),
            previousYearData: zeros,
            color: CITY_COLORS[i],
        }));

        return { courierChartData: data, courierLabels: labels };
    }, [couriers, cities]);

    const lastReport = reports[reports.length - 1] ?? null;

    const managerEarnings = useMemo(() =>
        managerReports
            .map(mr => {
                const manager = managers.find(m => m.id === mr.managerId);
                const prev = prevManagerReports.find(p => p.managerId === mr.managerId);
                const trend = prev && prev.totalPayout > 0
                    ? Math.round(((mr.totalPayout - prev.totalPayout) / prev.totalPayout) * 100)
                    : 0;
                return {
                    name: manager ? `${manager.firstname} ${manager.lastname}` : `Manager ${mr.managerId}`,
                    amount: mr.totalPayout,
                    trend,
                };
            })
            .sort((a, b) => b.amount - a.amount),
        [managerReports, prevManagerReports, managers]
    );

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    const post = async (path: string, body: object, successMsg: string, onClose: () => void) => {
        try {
            const res = await fetch(`${BASE_API}${path}`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
            });
            if (res.ok) { refresh(); showAlert('success', successMsg); onClose(); setValidationErrors(null); }
            else { const err = await res.json(); setValidationErrors(err.validationErrors); showAlert('error', err.message || 'Something went wrong'); }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const addCourier = (firstName: string, lastName: string, phoneNumber: string, nationality: string, cityId: number | undefined, managerId: number | undefined, ctr: number, commission: number) => {
        if (!firstName || !lastName || !phoneNumber || !cityId || !managerId || !ctr || !commission)
            return showAlert('error', 'Please complete all the fields');
        post('/couriers', { firstname: firstName, lastname: lastName, phoneNumber, nationality, cityId, managerId, ctr, commission }, 'Courier was added successfully', () => setIsAddCourierModalOpen(false));
    };
    const addManager = (firstName: string, lastName: string, phoneNumber: string, email: string, prefix: string, commission: number) => {
        if (!firstName || !lastName || !phoneNumber || !email || !prefix || isNaN(commission)) return showAlert('error', 'Please complete all the fields');
        post('/managers', { firstname: firstName, lastname: lastName, phoneNumber, email, prefix, managerCommission: commission }, 'Manager was added successfully', () => setIsAddManagerModalOpen(false));
    };
    const addTag = (name: string) => { if (!name) return showAlert('error', 'Please complete name field'); post('/tags', { name }, 'Tag was added successfully', () => setIsAddTagModalOpen(false)); };
    const addCity = (name: string) => { if (!name) return showAlert('error', 'Please complete name field'); post('/cities', { name }, 'City was added successfully', () => setIsAddCityModalOpen(false)); };

    const couriersPerCity = (cityId: number) => couriers.filter(c => c.cityId === cityId).length;
    const couriersPerPlatform = (platform: 'BOLT' | 'WOLT' | 'GLOVO') => accounts.filter(a => a.platform === platform).length;

    const recentCouriers = [...couriers]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

    return (
        <div className="flex flex-col gap-10">
            {alert.on && (
                <div className={`fixed top-5 right-5 z-100 max-w-sm w-full shadow-xl rounded-2xl p-4 animate-toast
                    ${alert.type === 'error' ? 'bg-(--error-bg) text-(--error-text)' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-start gap-3">
                        <MdError className={`mt-0.5 text-lg ${alert.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className="text-sm font-semibold">{alert.msg}</p>
                    </div>
                </div>
            )}

            {isAddCityModalOpen && <AddCityModal onClose={() => { setIsAddCityModalOpen(false); setValidationErrors(null); }} addCity={addCity} validationErrors={validationErrors} />}
            {isAddTagModalOpen && <AddTagModal onClose={() => { setIsAddTagModalOpen(false); setValidationErrors(null); }} addTag={addTag} validationErrors={validationErrors} />}
            {isAddManagerModalOpen && <AddManagerModal onClose={() => { setIsAddManagerModalOpen(false); setValidationErrors(null); }} addManager={addManager} validationErrors={validationErrors} />}
            {isAddCourierModalOpen && <AddCourierModal onClose={() => { setIsAddCourierModalOpen(false); setValidationErrors(null); }} addCourier={addCourier} managersData={managers} citiesData={cities} tagsData={tags} validationErrors={validationErrors} />}

            {/* ── KPI cards ── */}
            <section className="flex gap-4 flex-wrap justify-start items-start">
                <div className="flex flex-2 gap-4">
                    <Card type="dark" className="flex-1">
                        <span className="text-sm font-light">Overall Revenue (Last Report)</span>
                        {chartsLoading ? <Spinner size={8} /> : (
                            <span className="text-3xl font-medium">
                                {lastReport ? `lei ${lastReport.totalIncome.toLocaleString()}` : '—'}
                            </span>
                        )}
                    </Card>

                    <Card type="dark" className="flex-1">
                        {loading ? <Spinner size={12} /> : <>
                            <span className="text-sm font-light">Active Couriers</span>
                            <div className="flex justify-between">
                                <div className="flex flex-col justify-between">
                                    <span className="text-3xl font-medium">{couriers.length}</span>
                                    {cities.map(city => (
                                        <span key={city.id} className="text-xs font-light">{city.name}: {couriersPerCity(city.id)}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col justify-end gap-1">
                                    {([['BOLT', logoBolt], ['WOLT', logoWolt], ['GLOVO', logoGlovo]] as const).map(([platform, logo]) => (
                                        <div key={platform} className="flex items-center gap-2">
                                            <img src={logo} className="w-5 h-5 rounded-md" alt={platform} />
                                            <span className="text-md">{couriersPerPlatform(platform)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>}
                    </Card>
                </div>

                <Card type="light" className="flex-3">
                    <span className="text-sm text-(--text-primary) mb-4">
                        Earnings Per Manager {lastReport && `(${new Date(lastReport.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(lastReport.endedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`}
                    </span>
                    {chartsLoading ? (
                        <Spinner size={8} />
                    ) : managerEarnings.length === 0 ? (
                        <span className="text-xs text-gray-400">No data available</span>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {managerEarnings.map(item => (
                                <div key={item.name} className="flex justify-between items-center">
                                    <span className="text-xs text-(--text-primary)">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-(--text-primary) text-xs">lei {item.amount.toLocaleString()}</span>
                                        {item.trend !== 0 && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-(--error-bg) text-(--error-text)'}`}>
                                                {item.trend > 0 ? '▲' : '▼'} {Math.abs(item.trend)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </section>

            {/* ── Charts ── */}
            <section className="flex gap-6">
                <div className="p-6 bg-white rounded-2xl border-(--border-default) flex-1">
                    <h3 className="text-lg font-medium text-(--text-primary) mb-4">Earnings per Report</h3>
                    {chartsLoading ? <Spinner size={8} /> : (
                        <LineChart citiesData={revenueChartData} labels={reportLabels} dataType="revenue" currencySymbol="lei" groupLabel="Platforms" showComparison={false} />
                    )}
                </div>
                <div className="p-6 bg-white rounded-2xl border-(--border-default) flex-1">
                    <h3 className="text-lg font-medium text-(--text-primary) mb-4">Couriers Added per Week</h3>
                    {chartsLoading || loading ? <Spinner size={8} /> : courierChartData.length > 0 ? (
                        <LineChart citiesData={courierChartData} labels={courierLabels} dataType="couriers" groupLabel="Cities" showComparison={false} />
                    ) : (
                        <span className="text-xs text-gray-400">No data available</span>
                    )}
                </div>
            </section>

            {/* ── Recently Added ── */}
            <section className="bg-white rounded-2xl border border-(--border-default) overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-(--border-default)">
                    <h3 className="text-sm font-medium text-(--text-primary)">Recently Added Couriers</h3>
                    <NavLink to="/couriers" className="text-xs text-indigo-500 hover:underline">View all →</NavLink>
                </div>

                {loading ? (
                    <div className="p-6"><Spinner size={8} /></div>
                ) : recentCouriers.length === 0 ? (
                    <div className="px-6 py-8 text-center text-xs text-gray-400">No couriers yet</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-(--border-default)">
                                <th className="px-6 py-3 font-medium">Courier</th>
                                <th className="px-6 py-3 font-medium">City</th>
                                <th className="px-6 py-3 font-medium">Phone</th>
                                <th className="px-6 py-3 font-medium">Nationality</th>
                                <th className="px-6 py-3 font-medium text-right">Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCouriers.map(c => {
                                const city = cities.find(ci => ci.id === c.cityId);
                                const manager = managers.find(m => m.id === c.managerId);
                                return (
                                    <tr key={c.id} className="border-t border-(--border-default) hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-medium text-xs">{c.firstname} {c.lastname}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {manager ? `${manager.firstname} ${manager.lastname}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-gray-600">{city?.name ?? '—'}</td>
                                        <td className="px-6 py-3 text-xs text-gray-600">{c.phoneNumber}</td>
                                        <td className="px-6 py-3 text-xs text-gray-600">{c.nationality}</td>
                                        <td className="px-6 py-3 text-xs text-gray-400 text-right">
                                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            {/* ── Quick Actions ── */}
            <section>
                <h2 className="flex items-center gap-2 text-sm font-medium mb-3">
                    Quick Actions <FaHandSparkles />
                </h2>
                <div className="flex gap-2 flex-wrap text-white">
                    <Button onClickAction={() => setIsAddCourierModalOpen(true)}>Add Courier <MdOutlineDeliveryDining /></Button>
                    {isAdmin && <Button onClickAction={() => setIsAddManagerModalOpen(true)}>Add Manager <GrUserManager /></Button>}
                    <Button onClickAction={() => setIsAddTagModalOpen(true)}>Add Tag <FaTag /></Button>
                    {isAdmin && <Button onClickAction={() => setIsAddCityModalOpen(true)}>Add City <FaCity /></Button>}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
