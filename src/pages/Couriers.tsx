import { useMemo, useState } from "react"
import { NavLink } from "react-router-dom"
import { FaEye } from "react-icons/fa";
import { MdDelete, MdEdit, MdError, MdNavigateBefore, MdNavigateNext, MdSearch, MdFilterList, MdClear } from "react-icons/md";
import { AddCourierModal } from "../components/AddCourierModal";
import { EditCourierModal } from "../components/EditCourierModal";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Spinner from "../components/Spinner";
import { DeletionModal } from "../components/DeletionModal";
import { useAppData } from '../context/AppContext';
import type { Courier } from '../types/index'
import { getAuthHeaders, BASE_API } from '../utils/index';

const ITEMS_PER_PAGE = 20;

const Couriers = () => {
    const { couriers, cities, managers, tags, loading, refresh } = useAppData();

    const isAdmin = localStorage.getItem('user_role') === 'ROLE_ADMIN';
    const storedManagerId = localStorage.getItem('manager_id');
    const myManagerId = isAdmin ? null : (storedManagerId ? Number(storedManagerId) : null);

    const baseCouriers = useMemo(() => {
        if (isAdmin) return couriers;
        if (!myManagerId) return [];
        return couriers.filter(c => c.managerId === myManagerId);
    }, [isAdmin, myManagerId, couriers]);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCity, setSelectedCity] = useState<number | 'all'>('all');
    const [selectedNationality, setSelectedNationality] = useState<string | 'all'>('all');
    const [selectedTag, setSelectedTag] = useState<number | 'all'>('all');
    const [selectedManager, setSelectedManager] = useState<number | 'all'>('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [toEdit, setToEdit] = useState<Courier | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    // --- lookups ---
    const getCityName = (id: number) => cities.find(c => c.id === id)?.name ?? '';
    const getManagerName = (id: number) => { const m = managers.find(m => m.id === id); return m ? `${m.firstname} ${m.lastname}` : ''; };
    const getTagName = (id: number) => tags.find(t => t.id === id)?.name ?? '';

    const uniqueNationalities = useMemo(() =>
        Array.from(new Set(baseCouriers.map(c => c.nationality).filter(Boolean))).sort(), [baseCouriers]);

    const filtered = useMemo(() => baseCouriers.filter(c => {
        if (search.trim()) {
            const s = search.toLowerCase();
            const match =
                `${c.firstname ?? ''} ${c.lastname ?? ''}`.toLowerCase().includes(s) ||
                (c.phoneNumber ?? '').includes(search) ||
                (c.nationality ?? '').toLowerCase().includes(s) ||
                getCityName(c.cityId).toLowerCase().includes(s) ||
                getManagerName(c.managerId).toLowerCase().includes(s) ||
                c.tagIds?.some(id => getTagName(id).toLowerCase().includes(s));
            if (!match) return false;
        }
        if (selectedCity !== 'all' && c.cityId !== selectedCity) return false;
        if (selectedNationality !== 'all' && c.nationality !== selectedNationality) return false;
        if (selectedTag !== 'all' && !c.tagIds?.includes(selectedTag)) return false;
        if (isAdmin && selectedManager !== 'all' && c.managerId !== selectedManager) return false;
        return true;
    }), [baseCouriers, search, selectedCity, selectedNationality, selectedTag, selectedManager, isAdmin]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const visible = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const hasActiveFilters = selectedCity !== 'all' || selectedNationality !== 'all' ||
        selectedTag !== 'all' || selectedManager !== 'all' || search !== '';

    const clearFilters = () => {
        setSelectedCity('all'); setSelectedNationality('all');
        setSelectedTag('all'); setSelectedManager('all'); setSearch('');
    };


    // --- handlers ---
    const buildBody = (
        firstName: string, lastName: string, phoneNumber: string, nationality: string,
        cityId: number | undefined, managerId: number | undefined,
        ctr: number, commission: number, tagIds: number[], cnp: string
    ) => {
        if (!firstName || !lastName || !cityId || !managerId || ctr === undefined || commission === undefined) return null;
        return { firstname: firstName, lastname: lastName, phoneNumber: phoneNumber || null, nationality, cityId, managerId, ctr, commission, tagIds, cnp: cnp || null };
    };

    const addCourier = async (
        firstName: string, lastName: string, phoneNumber: string, nationality: string,
        cityId: number | undefined, managerId: number | undefined,
        ctr: number, commission: number, tagIds: number[], cnp: string, trcFile: File | null
    ) => {
        if (!phoneNumber) return showAlert('error', 'Please complete all the fields');
        const body = buildBody(firstName, lastName, phoneNumber, nationality, cityId, managerId, ctr, commission, tagIds, cnp);
        if (!body) return showAlert('error', 'Please complete all the fields');
        try {
            const res = await fetch(`${BASE_API}/couriers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const created = await res.json();
                if (trcFile && created?.id) {
                    const formData = new FormData();
                    formData.append('file', trcFile);
                    const headers = getAuthHeaders();
                    delete (headers as any)['Content-Type'];
                    await fetch(`${BASE_API}/files/upload-trc/courier/${created.id}`, {
                        method: 'POST',
                        headers,
                        body: formData,
                    });
                }
                refresh();
                showAlert('success', 'Courier was added successfully');
                setIsAddOpen(false);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const editCourier = async (courierId: number, ...args: Parameters<typeof buildBody>) => {
        const body = buildBody(...args);
        if (!body) return showAlert('error', 'Please complete all the fields');
        console.log('editCourier body:', JSON.stringify(body));
        try {
            const res = await fetch(`${BASE_API}/couriers/${courierId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Courier was updated successfully');
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

    const deleteCourier = async (id: number) => {
        try {
            const res = await fetch(`${BASE_API}/couriers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) { refresh(); showAlert('success', 'Courier was removed successfully'); }
        } catch (e: any) { showAlert('error', e.message); }
    };

    const selectCls = "px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

    return (
        <div className="w-full space-y-6">
            {alert.on && (
                <div className={`fixed top-5 right-5 z-100 max-w-sm w-full shadow-xl rounded-2xl p-4 animate-toast
                    ${alert.type === 'error' ? 'bg-[var(--error-bg)] text-[var(--error-text)]' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-start gap-3">
                        <MdError className={`mt-0.5 text-lg ${alert.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className="text-sm font-semibold">{alert.msg}</p>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <AddCourierModal
                    onClose={() => { setIsAddOpen(false); setValidationErrors(null); }}
                    addCourier={addCourier}
                    managersData={managers} citiesData={cities} tagsData={tags}
                    validationErrors={validationErrors}
                />
            )}

            {isEditOpen && toEdit && (
                <EditCourierModal
                    onClose={() => { setIsEditOpen(false); setToEdit(null); setValidationErrors(null); }}
                    editCourier={editCourier}
                    courier={toEdit}
                    managersData={managers} citiesData={cities} tagsData={tags}
                    validationErrors={validationErrors}
                />
            )}

            {deleteId && (
                <DeletionModal
                    message="Are you sure you want to delete a courier?"
                    onClose={() => setDeleteId(null)}
                    onDelete={() => { deleteCourier(deleteId); setDeleteId(null); }}
                />
            )}

            <h2 className="text-3xl font-semibold tracking-tight">Couriers</h2>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input nameValue="search" placeholderValue="Search" inputValue={search} hasIcon
                            onChangeAction={(e: any) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Button onClickAction={() => setIsAddOpen(true)}>Add Courier</Button>
                </div>

                <div className="flex flex-wrap gap-3 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <MdFilterList className="text-gray-500" size={20} />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <div className="flex gap-3 flex-wrap flex-1">
                        <div className="w-48">
                            <Select
                                value={selectedCity}
                                onChange={(value) => { setSelectedCity(value === 'all' ? 'all' : Number(value)); setPage(1); }}
                                placeholder="All Cities"
                                options={[...cities.map(c => ({ value: c.id, label: c.name }))]}
                            />
                        </div>

                        <div className="w-48">
                            <Select
                                value={selectedNationality}
                                onChange={(value) => { setSelectedNationality(String(value)); setPage(1); }}
                                placeholder="All Nationalities"
                                options={uniqueNationalities.map(n => ({ value: n, label: n }))}
                            />
                        </div>

                        <div className="w-48">
                            <Select
                                value={selectedTag}
                                onChange={(value) => { setSelectedTag(value === 'all' ? 'all' : Number(value)); setPage(1); }}
                                placeholder="All Tags"
                                options={tags.map(t => ({ value: t.id, label: t.name }))}
                            />
                        </div>

                        {isAdmin && (
                            <div className="w-48">
                                <Select
                                    value={selectedManager}
                                    onChange={(value) => { setSelectedManager(value === 'all' ? 'all' : Number(value)); setPage(1); }}
                                    placeholder="All Managers"
                                    options={managers.map(m => ({ value: m.id, label: `${m.firstname} ${m.lastname}` }))}
                                />
                            </div>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="ml-auto px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                            <MdClear size={16} />
                            Clear Filters
                        </button>
                    )}

                    <span className="text-sm text-gray-500">
                        {filtered.length} {filtered.length === 1 ? 'courier' : 'couriers'}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="relative flex flex-col space-y-4">
                <table className="w-full text-sm">
                    <thead className="text-left">
                        <tr>
                            {['Courier', 'Phone', 'Nationality', 'City', 'Tags', 'Manager', 'Actions'].map(h => (
                                <th key={h} className={`px-4 py-3${h === 'Actions' ? ' text-right' : ''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className="mt-96"><Spinner size={12} /></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center">No couriers found</td></tr>
                        ) : visible.map(c => (
                            <tr key={c.id} className="border-t border-white/5">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium">{c.firstname} {c.lastname}</div>
                                            <div className="text-xs text-gray-500">ID: {c.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{c.phoneNumber}</td>
                                <td className="px-4 py-3">{c.nationality}</td>
                                <td className="px-4 py-3">{getCityName(c.cityId)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {c.tagIds?.length
                                            ? c.tagIds.map(id => (
                                                <span key={id} className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                                    {getTagName(id)}
                                                </span>
                                            ))
                                            : <span className="text-xs text-gray-400">—</span>
                                        }
                                    </div>
                                </td>
                                <td className="px-4 py-3">{getManagerName(c.managerId)}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <NavLink to={`/couriers/${c.id}`}><FaEye size={16} /></NavLink>
                                        <button className="cursor-pointer" onClick={() => { setToEdit(c); setIsEditOpen(true); }}>
                                            <MdEdit size={16} />
                                        </button>
                                        <button className="cursor-pointer" onClick={() => setDeleteId(c.id)}>
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
                            Showing <b>{startIndex + 1}</b>–<b>{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b> couriers
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

export default Couriers;