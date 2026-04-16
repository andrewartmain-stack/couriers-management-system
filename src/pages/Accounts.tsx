import { useMemo, useState } from "react"
import { MdDelete, MdEdit, MdError, MdNavigateBefore, MdNavigateNext, MdSearch, MdFilterList, MdClear } from "react-icons/md";
import Spinner from "../components/Spinner";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import { AddAccountModal } from "../components/AddAccountModal";
import { EditAccountModal } from "../components/EditAccountModal";
import { DeletionModal } from '../components/DeletionModal'
import { useAppData } from '../context/AppContext';
import type { Account } from '../types/index'
import { getAuthHeaders, BASE_API } from '../utils/index';

const ITEMS_PER_PAGE = 20;

const Accounts = () => {
    const { accounts, couriers, loading, refresh } = useAppData();

    const isAdmin = localStorage.getItem('user_role') === 'ROLE_ADMIN';
    const storedManagerId = localStorage.getItem('manager_id');
    const myManagerId = isAdmin ? null : (storedManagerId ? Number(storedManagerId) : null);

    const visibleCouriers = useMemo(() => {
        if (isAdmin) return couriers;
        if (!myManagerId) return [];
        return couriers.filter(c => c.managerId === myManagerId);
    }, [isAdmin, myManagerId, couriers]);

    const baseAccounts = useMemo(() => {
        if (isAdmin) return accounts;
        if (!myManagerId) return [];
        const myCourierIds = new Set(visibleCouriers.map(c => c.id));
        return accounts.filter(a => myCourierIds.has(a.courierId));
    }, [isAdmin, myManagerId, accounts, visibleCouriers]);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toEdit, setToEdit] = useState<Account | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    const filtered = useMemo(() => baseAccounts.filter(a => {
        // Platform filter
        if (platformFilter && a.platform.toLowerCase() !== platformFilter.toLowerCase()) return false;

        // Status filter
        if (statusFilter && a.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

        // Search filter
        if (!search.trim()) return true;

        const searchLower = search.toLowerCase();

        return (
            (a.accountName?.toLowerCase() || '').includes(searchLower) ||
            (a.accountUID?.toLowerCase() || '').includes(searchLower) ||
            (a.phoneNumber || '').includes(search) ||
            (a.email?.toLowerCase() || '').includes(searchLower) ||
            (a.platform?.toLowerCase() || '').includes(searchLower)
        );
    }), [baseAccounts, search, platformFilter, statusFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;

    const getCourierName = (id: number) => {
        const c = couriers.find(c => c.id === id);
        return c ? `${c.firstname} ${c.lastname}` : 'Unknown';
    };

    const hasActiveFilters = platformFilter || statusFilter || search !== '';

    // --- handlers ---
    const addAccount = async (...args: Parameters<typeof buildAccountBody>) => {
        const body = buildAccountBody(...args);
        if (!body) return showAlert('error', 'Please complete all the fields');
        try {
            const res = await fetch(`${BASE_API}/accounts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Account was added successfully');
                setIsAddOpen(false);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const editAccount = async (accountId: number, ...args: Parameters<typeof buildAccountBody>) => {
        const body = buildAccountBody(...args);
        if (!body) return showAlert('error', 'Please complete all the fields');
        try {
            const res = await fetch(`${BASE_API}/accounts/${accountId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Account was updated successfully');
                setIsEditOpen(false);
                setToEdit(null);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const deleteAccount = async (id: number) => {
        try {
            const res = await fetch(`${BASE_API}/accounts/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Account was deleted successfully');
            } else {
                const text = await res.text();
                console.error('Delete account error:', text);
                let message = `Failed to delete account (${res.status})`;
                try { message = JSON.parse(text)?.message || message; } catch { if (text) message = text; }
                showAlert('error', message);
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    // --- badges ---
    const platformBadge = (p: string) => {
        const m: Record<string, string> = {
            bolt: 'bg-green-100 text-green-700',
            wolt: 'bg-blue-100 text-blue-700',
            glovo: 'bg-yellow-100 text-yellow-700',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${m[p.toLowerCase()] ?? m.bolt}`}>{p}</span>;
    };

    const statusBadge = (s: string) => {
        const m: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            blocked: 'bg-red-100 text-red-700',
            deleted: 'bg-gray-100 text-gray-700',
            unknown: 'bg-orange-100 text-orange-700',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${m[s.toLowerCase()] ?? m.unknown}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
    };

    return (
        <div className="w-full space-y-6">
            {isAddOpen && (
                <AddAccountModal
                    onClose={() => { setIsAddOpen(false); setValidationErrors(null); }}
                    addAccount={addAccount}
                    couriersData={visibleCouriers}
                    validationErrors={validationErrors}
                />
            )}

            {isEditOpen && toEdit && (
                <EditAccountModal
                    onClose={() => { setIsEditOpen(false); setToEdit(null); setValidationErrors(null); }}
                    editAccount={editAccount}
                    account={toEdit}
                    couriersData={visibleCouriers}
                    validationErrors={validationErrors}
                />
            )}

            {deleteId && (
                <DeletionModal
                    message="Are you sure you want to delete an account?"
                    onClose={() => setDeleteId(null)}
                    onDelete={() => { deleteAccount(deleteId); setDeleteId(null); }}
                />
            )}

            {alert.on && (
                <div className={`fixed top-5 right-5 z-100 max-w-sm w-full shadow-xl rounded-2xl p-4 animate-toast
                    ${alert.type === 'error' ? 'bg-(--error-bg) text-(--error-text)' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-start gap-3">
                        <MdError className={`mt-0.5 text-lg ${alert.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className="text-sm font-semibold">{alert.msg}</p>
                    </div>
                </div>
            )}

            <h2 className="text-3xl font-semibold tracking-tight">Accounts</h2>

            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input nameValue="search" placeholderValue="Search by name, UID, email..."
                            inputValue={search} hasIcon onChangeAction={(e: any) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Button onClickAction={() => setIsAddOpen(true)}>Add Account</Button>
                </div>

                <div className="flex flex-wrap gap-3 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <MdFilterList className="text-gray-500" size={20} />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <div className="flex gap-3 flex-wrap flex-1">
                        <div className="w-48">
                            <Select
                                value={platformFilter}
                                onChange={(value) => { setPlatformFilter(String(value)); setPage(1); }}
                                placeholder="All Platforms"
                                options={[
                                    { value: 'bolt', label: 'Bolt' },
                                    { value: 'wolt', label: 'Wolt' },
                                    { value: 'glovo', label: 'Glovo' }
                                ]}
                            />
                        </div>

                        <div className="w-48">
                            <Select
                                value={statusFilter}
                                onChange={(value) => { setStatusFilter(String(value)); setPage(1); }}
                                placeholder="All Statuses"
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'blocked', label: 'Blocked' },
                                    { value: 'deleted', label: 'Deleted' },
                                    { value: 'unknown', label: 'Unknown' }
                                ]}
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={() => { setPlatformFilter(''); setStatusFilter(''); setSearch(''); setPage(1); }}
                            className="ml-auto px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <MdClear size={16} />
                            Clear Filters
                        </button>
                    )}

                    <span className="text-sm text-gray-500">
                        {filtered.length} {filtered.length === 1 ? 'account' : 'accounts'}
                    </span>
                </div>
            </div>

            <div className="relative flex flex-col space-y-4">
                <table className="w-full text-sm">
                    <thead className="text-left">
                        <tr>
                            {['Account', 'UID', 'Assigned to', 'Platform', 'Status', 'Phone', 'Email', 'Actions'].map(h => (
                                <th key={h} className={`px-4 py-3${h === 'Actions' ? ' text-right' : ''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8}><div className="mt-96"><Spinner size={12} /></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-6 text-center">No accounts found</td></tr>
                        ) : visible.map(a => (
                            <tr key={a.id} className="border-t border-white/5">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{a.accountName}</div>
                                    <div className="text-xs text-gray-500">ID: {a.id}</div>
                                </td>
                                <td className="px-4 py-3">{a.accountUID}</td>
                                <td className="px-4 py-3">{getCourierName(a.courierId)}</td>
                                <td className="px-4 py-3">{platformBadge(a.platform)}</td>
                                <td className="px-4 py-3">{statusBadge(a.status)}</td>
                                <td className="px-4 py-3">{a.phoneNumber}</td>
                                <td className="px-4 py-3">{a.email}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="cursor-pointer" onClick={() => { setToEdit(a); setIsEditOpen(true); }}>
                                            <MdEdit size={16} />
                                        </button>
                                        <button className="cursor-pointer" onClick={() => setDeleteId(a.id)}>
                                            <MdDelete size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-lg shadow">
                        <span className="text-sm text-gray-700">
                            Showing <b>{startIndex + 1}</b>–<b>{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                className={`p-2 rounded-lg ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <MdNavigateBefore size={24} />
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                        return (
                                            <button key={p} onClick={() => setPage(p)}
                                                className={`px-3 py-1 rounded-lg text-sm ${page === p ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                                                {p}
                                            </button>
                                        );
                                    if (p === page - 2 || p === page + 2)
                                        return <span key={p} className="px-2">...</span>;
                                    return null;
                                })}
                            </div>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                className={`p-2 rounded-lg ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <MdNavigateNext size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// helper — валидация + формирование body
function buildAccountBody(
    courierId: number, platform: string, status: string,
    accountUID: string, accountName: string, phoneNumber: string, email: string
) {
    if (!courierId || !platform || !status || !accountUID || !accountName || !phoneNumber || !email)
        return null;
    return { courierId, platform, status, accountUID, accountName, phoneNumber, email };
}

export default Accounts;