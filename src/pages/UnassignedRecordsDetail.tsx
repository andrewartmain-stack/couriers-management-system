import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthHeaders, getAuthHeadersNoContentType, BASE_API } from "../utils/index";
import { useAppData } from "../context/AppContext";
import Button from "../components/Button";
import { MdError, MdEdit, MdCheck, MdClose, MdCheckCircle, MdPersonAdd, MdNavigateBefore } from "react-icons/md";
import { AddCourierModal } from "../components/AddCourierModal";

import Spinner from "../components/Spinner";
import type { Courier, City, Manager, Tag, ReportByManager } from "../types/index";

interface BoltRecord {
    UID: string;
    adjustedEarnings: number;
    city: string;
    commission: number;
    courierTotal: number;
    ctr: number;
    firstname: string;
    id: number;
    lastname: string;
    overdueCashDebt: number;
    rowNumber: number;
    tips: number;
}

interface GlovoRecord {
    id: number;
    name: string;
    email: string;
    city: string;
    courierTotal: number;
    cashBalance: number;
    orders: number;
    appCommission: number;
    bonus: number;
    income: number;
    tips: number;
    accountActivationFee: number;
    total: number | null;
    ctr: number | null;
    commission: number | null;
}

interface WoltRecord {
    id: number;
    name: string;
    payoutID: string;
    taskFees: number;
    shiftGuarantee: number;
    manualTransactions: number;
    bonus: number;
    payoutCorrection: number;
    otherCost: number;
    tips: number;
    additionalCompensation: number;
    compensationDeductions: number;
    operationalFeeDeduction: number;
    activationFeeDeduction: number;
    manualGD: number;
    manualGDReturn: number;
    cashOffset: number;
    ctr: number | null;
    commission: number | null;
    courierTotal: number;
}

type CourierRecord = BoltRecord | GlovoRecord | WoltRecord;

interface EditingCell {
    recordId: number;
    field: 'ctr' | 'commission';
    value: string;
}

interface ModifiedFields {
    [recordId: number]: {
        ctr?: boolean;
        commission?: boolean;
    };
}

const UnassignedRecordsDetail = () => {
    const { refresh } = useAppData();
    const [active, setActive] = useState<string>("Bolt");
    const [records, setRecords] = useState<CourierRecord[]>([]);
    const [clickedRecordAssignId, setClickedRecordAssignId] = useState<number | null>(null);
    const [clickedRecordAssignUUID, setClickedRecordAssignUUID] = useState<string | null>(null);
    const [modifiedFields, setModifiedFields] = useState<ModifiedFields>({});
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({ isActive: false, type: "error", message: "Something went wrong" });

    const [assignModalRecord, setAssignModalRecord] = useState<CourierRecord | null>(null);
    const [assignStep, setAssignStep] = useState<'choice' | 'existing' | 'create'>('choice');
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [managerReports, setManagerReports] = useState<ReportByManager[]>([]);
    const [tagsData, setTagsData] = useState<Tag[]>([]);
    const [courierSearch, setCourierSearch] = useState('');
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [createValidationErrors, setCreateValidationErrors] = useState<Record<string, string> | null>(null);

    const { reportId } = useParams();
    const navigate = useNavigate();

    const isBoltRecord = (record: CourierRecord): record is BoltRecord => {
        return 'UID' in record;
    };

    const isGlovoRecord = (record: CourierRecord): record is GlovoRecord => {
        return 'email' in record;
    };

    const isWoltRecord = (record: CourierRecord): record is WoltRecord => {
        return 'payoutID' in record;
    };

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, isActive: false }));
        }, 3000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setRecords([]);

                const platform = active.toLowerCase();
                const response = await fetch(
                    `${BASE_API}/records/${platform}/report/${reportId}/unassigned`,
                    { headers: getAuthHeaders() }
                );

                console.log(response);

                if (!response.ok) {
                    throw new Error("Failed to fetch records");
                }

                const data = await response.json();
                setRecords(data);
                setModifiedFields({});
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error.message);
                    showAlert("error", "Failed to load records");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [active]);

    const calculateCourierTotal = (
        adjustedEarnings: number,
        ctr: number,
        commission: number,
        debt: number
    ) => {
        return adjustedEarnings - (adjustedEarnings * commission / 100) - ctr - debt;
    };

    const calculateGlovoCourierTotal = (
        total: number,
        ctr: number | null,
        commission: number | null
    ) => {
        if (ctr === null || commission === null) return total;
        return total - (total * commission / 100) - ctr;
    };

    const calculateWoltCourierTotal = (
        total: number,
        ctr: number | null,
        commission: number | null
    ) => {
        if (ctr === null || commission === null) return total;
        return total - (total * commission / 100) - ctr;
    };

    const calculateGlovoTotal = (
        courierTotal: number,
        tips: number,
        ctr: number | null,
        commission: number | null
    ) => {
        if (ctr === null || commission === null) return courierTotal + tips;
        return (courierTotal + tips - ctr) * (1 - commission / 100);
    };

    const handleEditClick = (recordId: number, field: 'ctr' | 'commission', currentValue: number | null) => {
        setEditingCell({
            recordId,
            field,
            value: currentValue?.toString() || '0'
        });
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
    };

    const handleSaveEdit = () => {
        if (!editingCell) return;

        const newValue = parseFloat(editingCell.value);
        if (isNaN(newValue) || newValue < 0) {
            showAlert("error", "Please enter a valid number");
            return;
        }

        setRecords(prevRecords =>
            prevRecords.map(record => {
                if (record.id === editingCell.recordId) {
                    const updatedRecord = {
                        ...record,
                        [editingCell.field]: newValue
                    };

                    if (isBoltRecord(updatedRecord)) {
                        updatedRecord.courierTotal = calculateCourierTotal(
                            updatedRecord.adjustedEarnings,
                            updatedRecord.ctr,
                            updatedRecord.commission,
                            updatedRecord.overdueCashDebt
                        );
                    } else if (isGlovoRecord(updatedRecord)) {
                        const baseTotal = updatedRecord.income + updatedRecord.tips;
                        updatedRecord.courierTotal = calculateGlovoCourierTotal(
                            baseTotal,
                            updatedRecord.ctr,
                            updatedRecord.commission
                        );
                    } else if (isWoltRecord(updatedRecord)) {
                        const baseTotal = updatedRecord.taskFees + updatedRecord.tips;
                        updatedRecord.courierTotal = calculateWoltCourierTotal(
                            baseTotal,
                            updatedRecord.ctr,
                            updatedRecord.commission
                        );
                    }

                    setModifiedFields(prev => ({
                        ...prev,
                        [record.id]: {
                            ...prev[record.id],
                            [editingCell.field]: true
                        }
                    }));

                    return updatedRecord;
                }
                return record;
            })
        );

        setEditingCell(null);
        showAlert("success", "Value updated successfully");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const formatInt = (value: number | null) => {
        if (value === null) return '-';
        return Math.round(value).toString();
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat("ro-RO", {
            minimumFractionDigits: 2,
        }).format(value);
    };

    const renderEditableCell = (
        record: CourierRecord,
        field: 'ctr' | 'commission',
        value: number | null
    ) => {
        const isEditing = editingCell?.recordId === record.id && editingCell?.field === field;
        const isModified = modifiedFields[record.id]?.[field] || false;

        if (isEditing) {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        step="0.01"
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onKeyDown={handleKeyDown}
                        className="w-20 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-800"
                    >
                        <MdCheck size={18} />
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-800"
                    >
                        <MdClose size={18} />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-end gap-2 group">
                <span className={isModified ? "text-blue-600 font-semibold" : ""}>
                    {value === null ? '-' : field === 'commission' ? `${Math.round(value)}%` : Math.round(value).toString()}
                </span>
                <button
                    onClick={() => handleEditClick(record.id, field, value)}
                    className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity"
                >
                    <MdEdit size={16} />
                </button>
            </div>
        );
    };

    const getTotalEarnings = () => {
        if (active === "Bolt") {
            return records.reduce((sum, r) => {
                if (isBoltRecord(r)) return sum + r.courierTotal;
                return sum;
            }, 0);
        } else if (active === "Glovo") {
            return records.reduce((sum, r) => {
                if (isGlovoRecord(r)) {
                    return sum + r.courierTotal;
                }
                return sum;
            }, 0);
        } else if (active === "Wolt") {
            return records.reduce((sum, r) => {
                if (isWoltRecord(r)) return sum + r.courierTotal;
                return sum;
            }, 0);
        }
        return 0;
    };

    const getRecordDisplayName = (record: CourierRecord): string => {
        if (isBoltRecord(record)) return `${record.firstname} ${record.lastname} (${record.UID})`;
        if (isGlovoRecord(record)) return record.name;
        if (isWoltRecord(record)) return record.name;
        return 'Unknown';
    };

    const handleAssignClick = (record: CourierRecord) => {
        setAssignModalRecord(record);
        setAssignStep('choice');
        setSelectedCourier(null);
        setCourierSearch('');
        setCreateValidationErrors(null);

        Promise.all([
            fetch(`${BASE_API}/couriers`, { headers: getAuthHeadersNoContentType() }).then(r => r.json()),
            fetch(`${BASE_API}/cities`, { headers: getAuthHeadersNoContentType() }).then(r => r.json()),
            fetch(`${BASE_API}/managers`, { headers: getAuthHeadersNoContentType() }).then(r => r.json()),
            fetch(`${BASE_API}/tags`, { headers: getAuthHeadersNoContentType() }).then(r => r.json()),
            fetch(`${BASE_API}/manager-reports/report/${reportId}`, { headers: getAuthHeadersNoContentType() }).then(r => r.json()),
        ]).then(([c, ci, m, t, mr]) => {
            setCouriers(c);
            setCities(ci);
            setManagers(m);
            setTagsData(t);
            setManagerReports(mr);
        }).catch(console.error);
    };

    const handleAssignToExisting = async () => {
        if (!selectedCourier || !assignModalRecord) return;
        setAssigning(true);
        try {
            const managerReport = managerReports.find(mr => mr.managerId === selectedCourier.managerId);
            const managerReportId = managerReport?.id;
            const response = await fetch(
                `${BASE_API}/records/${clickedRecordAssignId}/account/${clickedRecordAssignUUID}/managerReport/${managerReportId}/courier/${selectedCourier.id}`,
                { method: 'PATCH', headers: getAuthHeaders() }
            );

            console.log(`${BASE_API}/records/${clickedRecordAssignId}/account/${clickedRecordAssignUUID}/managerReport/${managerReportId}/courier/${selectedCourier.id}`);

            if (!response.ok) throw new Error('Failed to assign record');
            setRecords(prev => prev.filter(r => r.id !== assignModalRecord.id));
            setAssignModalRecord(null);
            refresh();
            showAlert('success', 'Record assigned successfully');
        } catch (e) {
            showAlert('error', (e as Error).message || 'Failed to assign record');
        } finally {
            setAssigning(false);
        }
    };

    const handleCreateAndAssign = async (
        firstname: string, lastname: string, phoneNumber: string, nationality: string,
        cityId: number | undefined, managerId: number | undefined,
        ctr: number, commission: number, tagIds: number[]
    ) => {
        if (!assignModalRecord) return;
        setAssigning(true);
        setCreateValidationErrors(null);
        try {
            const managerReport = managerReports.find(mr => mr.managerId === managerId);
            const managerReportId = managerReport?.id;
            const createResponse = await fetch(`${BASE_API}/records/${clickedRecordAssignId}/account/${clickedRecordAssignUUID}/managerReport/${managerReportId}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ firstname, lastname, phoneNumber, nationality, cityId, managerId, ctr, commission, tagIds }),
            });
            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                if (createResponse.status === 400) setCreateValidationErrors(errorData);
                throw new Error('Failed to create courier');
            }

            setRecords(prev => prev.filter(r => r.id !== assignModalRecord.id));
            setAssignModalRecord(null);
            refresh();
            showAlert('success', 'Courier created and record assigned successfully');
        } catch (e) {
            showAlert('error', (e as Error).message || 'Failed to create and assign');
        } finally {
            setAssigning(false);
        }
    };

    const renderAssignModal = () => {
        if (!assignModalRecord) return null;

        const filteredCouriers = couriers.filter(c =>
            `${c.firstname} ${c.lastname}`.toLowerCase().includes(courierSearch.toLowerCase())
        );

        if (assignStep === 'create') {
            return (
                <AddCourierModal
                    onClose={() => setAssignModalRecord(null)}
                    addCourier={handleCreateAndAssign}
                    managersData={managers}
                    citiesData={cities}
                    tagsData={tagsData}
                    validationErrors={createValidationErrors}
                />
            );
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setAssignModalRecord(null)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    {assignStep === 'choice' && (
                        <>
                            <h2 className="text-lg font-semibold mb-1">Assign Record</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                {getRecordDisplayName(assignModalRecord)}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setAssignStep('existing')}
                                    className="flex flex-col items-start gap-1 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                                >
                                    <span className="font-medium text-gray-900">Assign to Existing Courier</span>
                                    <span className="text-xs text-gray-500">Link this record to a courier already in the system</span>
                                </button>
                                <button
                                    onClick={() => setAssignStep('create')}
                                    className="flex flex-col items-start gap-1 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                                >
                                    <span className="font-medium text-gray-900">Create a Courier and Assign</span>
                                    <span className="text-xs text-gray-500">Register a new courier and assign this record to them</span>
                                </button>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button variant="error" onClickAction={() => setAssignModalRecord(null)}>Cancel</Button>
                            </div>
                        </>
                    )}

                    {assignStep === 'existing' && (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => setAssignStep('choice')}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    <MdNavigateBefore size={24} />
                                </button>
                                <h2 className="text-lg font-semibold">Select Courier</h2>
                            </div>
                            <input
                                type="text"
                                placeholder="Search couriers..."
                                value={courierSearch}
                                onChange={e => setCourierSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                {filteredCouriers.length === 0 ? (
                                    <p className="text-sm text-gray-500 p-4 text-center">No couriers found</p>
                                ) : (
                                    filteredCouriers.map(courier => (
                                        <button
                                            key={courier.id}
                                            onClick={() => setSelectedCourier(courier)}
                                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedCourier === courier ? 'bg-blue-50' : ''}`}
                                        >
                                            <span className="text-sm font-medium text-gray-900">{courier.firstname} {courier.lastname}</span>
                                            {selectedCourier === courier && <MdCheck size={18} className="text-blue-600" />}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="error" onClickAction={() => setAssignModalRecord(null)}>Cancel</Button>
                                <Button
                                    onClickAction={() => {
                                        handleAssignToExisting()
                                    }
                                    }
                                    disabled={!selectedCourier || assigning}
                                >
                                    {assigning ? 'Assigning...' : 'Assign'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderTable = () => {
        if (loading) {
            return <div className="mt-96"><Spinner size={12} /></div>;
        }

        if (records.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500">No records found</p>
                </div>
            );
        }

        const firstRecord = records[0];

        if (isBoltRecord(firstRecord)) {
            return (
                <>
                    <div className="overflow-x-auto rounded-lg shadow flex-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adjusted Earnings</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Debt</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tips</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CTR<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Commission %<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record) => {
                                    if (!isBoltRecord(record)) return null;
                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.rowNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.UID}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.firstname} {record.lastname}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.city}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatNumber(record.adjustedEarnings)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.overdueCashDebt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.tips)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'ctr', record.ctr)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'commission', record.commission)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.courierTotal)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => {
                                                        setClickedRecordAssignId(record.id);
                                                        setClickedRecordAssignUUID(record.UID);
                                                        handleAssignClick(record)
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <MdPersonAdd size={16} />
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900">Total ({records.length} couriers)</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isBoltRecord(r) ? sum + r.adjustedEarnings : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isBoltRecord(r) ? sum + r.overdueCashDebt : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isBoltRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isBoltRecord(r) ? sum + r.ctr : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isBoltRecord(r) ? sum + r.courierTotal : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            );
        } else if (isWoltRecord(firstRecord)) {
            return (
                <>
                    <div className="overflow-x-auto rounded-lg shadow flex-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Payout ID</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Task Fees</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Guarantee</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Manual Transactions</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Cost</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Correction</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Other Cost</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tips</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Compensation</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Compensation Deductions</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Operational Fee Deduction</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Activation Fee Deduction</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Manual GD</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Manual GD Return</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Offset</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CTR<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Courier Commission<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record) => {
                                    if (!isWoltRecord(record)) return null;
                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.payoutID}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.taskFees)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.shiftGuarantee)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.manualTransactions)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.bonus)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.payoutCorrection)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.otherCost)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.tips)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.additionalCompensation)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.compensationDeductions)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.operationalFeeDeduction)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.activationFeeDeduction)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.manualGD)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.manualGDReturn)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.cashOffset)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'ctr', record.ctr)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'commission', record.commission)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatInt(record.courierTotal)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleAssignClick(record)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <MdPersonAdd size={16} />
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={2} className="px-4 py-4 text-sm font-bold text-gray-900">Total ({records.length} couriers)</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.taskFees : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.shiftGuarantee : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualTransactions : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.bonus : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.payoutCorrection : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.otherCost : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.additionalCompensation : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.compensationDeductions : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.operationalFeeDeduction : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.activationFeeDeduction : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualGD : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualGDReturn : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.cashOffset : sum, 0))}
                                    </td>
                                    <td colSpan={2} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(records.reduce((sum, r) => isWoltRecord(r) ? sum + r.courierTotal : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            );
        } else if (isGlovoRecord(firstRecord)) {
            return (
                <>
                    <div className="overflow-x-auto rounded-lg shadow flex-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Active Account</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Cash Balance</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guaranteed</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Fee Reversal</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Bonus</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Order Count Bonus</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sticker Bonus</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Other Bonuses</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Income Recalculations</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Fee</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Cash Payment</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Period Adjustments</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tips</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Account Opening Fee</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">App Fee</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Adjustments</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Income to Transfer</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CTR<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Courier Commission<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record) => {
                                    if (!isGlovoRecord(record)) return null;
                                    const total = record.total ?? calculateGlovoTotal(record.courierTotal, record.tips, record.ctr, record.commission);
                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.city}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.email}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.cashBalance)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.orders)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.bonus)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.income)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.tips)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.accountActivationFee)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.appCommission)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatNumber(total)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'ctr', record.ctr)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'commission', record.commission)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.courierTotal)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleAssignClick(record)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <MdPersonAdd size={16} />
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-sm font-bold text-gray-900">Total ({records.length} accounts)</td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.cashBalance : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.orders : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.bonus : sum, 0))}
                                    </td>
                                    <td colSpan={4} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.income : sum, 0))}
                                    </td>
                                    <td colSpan={3} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.accountActivationFee : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.appCommission : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(getTotalEarnings())}
                                    </td>
                                    <td colSpan={2} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(records.reduce((sum, r) => isGlovoRecord(r) ? sum + r.courierTotal : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className="w-full h-full space-y-6">
            {alert.isActive && (
                <div className={`
                fixed top-5 right-5 z-100
                max-w-sm w-full
                            ${alert.type === "error" ? "bg-(--error-bg) text-(--error-text)" : "bg-green-100 text-green-700"}
                shadow-xl
                rounded-2xl p-4
                animate-toast
              `}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 text-lg ${alert.type === "error" ? "text-red-500" : "text-green-500"}`}>
                            {alert.type === "error" ? <MdError /> : <MdCheckCircle />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-semibold leading-snug">
                                {alert.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-medium">Unassigned Records</h2>
                </div>
                <div className="flex items-center gap-10">
                    <ul className="flex gap-4 text-xs">
                        <li onClick={() => setActive("Bolt")} className={`p-2 px-4 rounded-full cursor-pointer transition ${active === "Bolt" ? "bg-green-300" : "bg-green-100 hover:bg-green-300"}`}>Bolt</li>
                        <li onClick={() => setActive("Wolt")} className={`p-2 px-4 rounded-full cursor-pointer transition ${active === "Wolt" ? "bg-blue-300" : "bg-blue-100 hover:bg-blue-300"}`}>Wolt</li>
                        <li onClick={() => setActive("Glovo")} className={`p-2 px-4 rounded-full cursor-pointer transition ${active === "Glovo" ? "bg-yellow-300" : "bg-yellow-100 hover:bg-yellow-300"}`}>Glovo</li>
                    </ul>
                    <span>Total Earnings: <strong>{formatCurrency(getTotalEarnings())}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClickAction={() => navigate(-1)}>Back</Button>
                </div>
            </div>

            {renderTable()}
            {renderAssignModal()}
        </div>
    );
};

export default UnassignedRecordsDetail;