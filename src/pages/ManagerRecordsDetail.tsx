import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import { MdError, MdEdit, MdCheck, MdClose, MdCheckCircle, MdFiberManualRecord } from "react-icons/md";
import Input from "../components/Input";
import Spinner from "../components/Spinner";
import { getAuthHeaders, getAuthHeadersNoContentType, BASE_API } from '../utils/index';
import type { Courier, Tag } from '../types';

interface BoltRecord {
    UID: string;
    personalCourierId: number;
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
    personalCourierId: number;
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
    personalCourierId: number;
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

interface NegroRecord {
    id: number;
    personalCourierId: number;
    target: number;
    accounts: string;
    boltEarning: number;
    woltEarning: number;
    glovoEarning: number;
    totalEarning: number;
    paidBike: number;
    bikeDifference: number;
    bikeFromCompany: number;
    accommodation: number;
    compensation: number;
    compensationReason: string;
    managerCommission: number;
    courierTotalWithoutBikeDifference: number;
    courierTotal: number;
}

interface NegroUpdateDto {
    id: number;
    paidBike: number;
    bikeFromCompany: number;
    compensation: number;
    managerCommission: number;
    compensationReason: string;
}

type CourierRecord = BoltRecord | GlovoRecord | WoltRecord;

interface EditingCell {
    recordId: number;
    field: 'ctr' | 'commission';
    value: string;
}

interface NegroEditingCell {
    recordId: number;
    field: 'paidBike' | 'bikeFromCompany' | 'compensation' | 'managerCommission' | 'compensationReason';
    value: string;
}

interface UpdateRecordDto {
    id: number;
    newCtr: number | null;
    newCommission: number | null;
    newCourierTotal: number;
}

interface ModifiedFields {
    [recordId: number]: {
        ctr?: boolean;
        commission?: boolean;
    };
}

const ManagerRecordsDetail = () => {
    const [active, setActive] = useState<string>("Bolt");
    const [records, setRecords] = useState<CourierRecord[]>([]);
    const [negroRecords, setNegroRecords] = useState<NegroRecord[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [_originalRecords, setOriginalRecords] = useState<CourierRecord[]>([]);
    const [modifiedFields, setModifiedFields] = useState<ModifiedFields>({});
    const [negroModifiedFields, setNegroModifiedFields] = useState<{ [id: number]: { [field: string]: boolean } }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showCard, setShowCard] = useState(false);
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [negroEditingCell, setNegroEditingCell] = useState<NegroEditingCell | null>(null);
    const [alert, setAlert] = useState<{
        isActive: boolean;
        type: "error" | "success";
        message: string;
    }>({ isActive: false, type: "error", message: "Something went wrong" });

    const { reportId, managerId: managerReportId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const managerName = searchParams.get('managerName');

    const modifiedFieldsCount = Object.values(modifiedFields).reduce((total, fields) => {
        return total + (fields.ctr ? 1 : 0) + (fields.commission ? 1 : 0);
    }, 0);

    const negroModifiedCount = useMemo(() =>
        Object.keys(negroModifiedFields).filter(
            id => Object.values(negroModifiedFields[Number(id)]).some(Boolean)
        ).length,
        [negroModifiedFields]
    );

    const currentModifiedCount = active === "Negro" ? negroModifiedCount : modifiedFieldsCount;

    const courierMultiAccountData = useMemo(() => {
        const counts: Record<number, number> = {};
        const totals: Record<number, number> = {};
        records.forEach(r => {
            counts[r.personalCourierId] = (counts[r.personalCourierId] || 0) + 1;
            totals[r.personalCourierId] = (totals[r.personalCourierId] || 0) + r.courierTotal;
        });
        return { counts, totals };
    }, [records]);

    const cardTagId = tags.find(t => t.name.toLowerCase() === 'card')?.id ?? null;

    const getCourierName = (id: number) => {
        const courier = couriers.find(c => c.id === id);
        return courier ? `${courier.firstname} ${courier.lastname}` : '-';
    };

    const filteredRecords = records.filter(record => {
        const courier = couriers.find(c => c.id === record.personalCourierId);
        const hasCard = courier && cardTagId !== null && courier.tagIds.includes(cardTagId);
        const cardFilter = showCard ? hasCard : !hasCard;

        const searchLower = searchTerm.toLowerCase();
        const courierName = getCourierName(record.personalCourierId).toLowerCase();
        const firstName = 'firstname' in record ? record.firstname?.toLowerCase() : '';
        const lastName = 'lastname' in record ? record.lastname?.toLowerCase() : '';
        const name = 'name' in record ? record.name?.toLowerCase() : '';

        const matchesSearch = !searchTerm ||
            courierName.includes(searchLower) ||
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            name.includes(searchLower);

        return cardFilter && matchesSearch;
    });

    const filteredNegroRecords = negroRecords.filter(record => {
        const courier = couriers.find(c => c.id === record.personalCourierId);
        const hasCard = courier && cardTagId !== null && courier.tagIds.includes(cardTagId);
        const cardFilter = showCard ? hasCard : !hasCard;
        const courierName = getCourierName(record.personalCourierId).toLowerCase();
        const matchesSearch = !searchTerm || courierName.includes(searchTerm.toLowerCase());
        return cardFilter && matchesSearch;
    });


    useEffect(() => {
        fetch(`${BASE_API}/couriers`, { headers: getAuthHeadersNoContentType() })
            .then(r => r.json())
            .then(setCouriers)
            .catch(console.error);
        fetch(`${BASE_API}/tags`, { headers: getAuthHeadersNoContentType() })
            .then(r => r.json())
            .then(setTags)
            .catch(console.error);
    }, []);

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
                if (active === "Negro") {
                    setNegroRecords([]);
                } else {
                    setRecords([]);
                }

                const platform = active.toLowerCase();
                const response = await fetch(
                    `${BASE_API}/records/${platform}/manager-report/${managerReportId}`,
                    { headers: getAuthHeadersNoContentType() }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch records");
                }

                const data = await response.json();

                if (active === "Negro") {
                    setNegroRecords(data);
                } else {
                    setRecords(data);
                    setOriginalRecords(JSON.parse(JSON.stringify(data)));
                    setModifiedFields({});
                }
            } catch (error) {
                if (error instanceof Error) {
                    console.error(error.message);
                    showAlert("error", "Failed to load records");
                }
            } finally {
                setLoading(false);
            }
        };

        if (managerReportId) {
            fetchData();
        }
    }, [managerReportId, active]);

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

    // Negro edit handlers
    const handleNegroEditClick = (recordId: number, field: NegroEditingCell['field'], currentValue: string) => {
        setNegroEditingCell({ recordId, field, value: currentValue });
    };

    const handleNegroCancelEdit = () => {
        setNegroEditingCell(null);
    };

    const handleNegroSaveEdit = () => {
        if (!negroEditingCell) return;

        if (negroEditingCell.field !== 'compensationReason') {
            const val = parseInt(negroEditingCell.value);
            if (isNaN(val) || val < 0) {
                showAlert("error", "Please enter a valid non-negative number");
                return;
            }
        }

        setNegroRecords(prev => prev.map(r => {
            if (r.id !== negroEditingCell.recordId) return r;
            const updated = { ...r };
            if (negroEditingCell.field === 'compensationReason') {
                updated.compensationReason = negroEditingCell.value;
            } else {
                (updated as Record<string, unknown>)[negroEditingCell.field] = parseInt(negroEditingCell.value);
            }
            return updated;
        }));

        setNegroModifiedFields(prev => ({
            ...prev,
            [negroEditingCell.recordId]: {
                ...prev[negroEditingCell.recordId],
                [negroEditingCell.field]: true
            }
        }));

        setNegroEditingCell(null);
        showAlert("success", "Value updated successfully");
    };

    const handleNegroKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleNegroSaveEdit();
        else if (e.key === 'Escape') handleNegroCancelEdit();
    };

    const handleSaveChanges = async () => {
        if (currentModifiedCount === 0) {
            showAlert("error", "No changes to save");
            return;
        }

        if (!reportId || !managerReportId) {
            showAlert("error", "Missing report or manager report ID");
            return;
        }

        setSaving(true);

        try {
            if (active === "Negro") {
                const modifiedIds = Object.keys(negroModifiedFields)
                    .filter(id => Object.values(negroModifiedFields[Number(id)]).some(Boolean))
                    .map(Number);

                const updates: NegroUpdateDto[] = modifiedIds.map(id => {
                    const record = negroRecords.find(r => r.id === id);
                    if (!record) throw new Error(`Record ${id} not found`);
                    return {
                        id: record.id,
                        paidBike: record.paidBike,
                        bikeFromCompany: record.bikeFromCompany,
                        compensation: record.compensation,
                        managerCommission: record.managerCommission,
                        compensationReason: record.compensationReason,
                    };
                });

                const response = await fetch(
                    `${BASE_API}/records/bulk-update/negro/report/${reportId}/manager-report/${managerReportId}`,
                    {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(updates)
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    console.error(error);
                    throw new Error("Failed to save changes");
                }

                setNegroModifiedFields({});
                showAlert("success", `Successfully saved ${negroModifiedCount} change${negroModifiedCount > 1 ? 's' : ''}`);
            } else {
                const modifiedRecordIds = Object.keys(modifiedFields).map(Number);
                const updates: UpdateRecordDto[] = modifiedRecordIds.map(recordId => {
                    const record = records.find(r => r.id === recordId);
                    if (!record) throw new Error(`Record ${recordId} not found`);

                    let newCourierTotal: number;
                    let newCtr: number | null;
                    let newCommission: number | null;

                    if (isBoltRecord(record)) {
                        newCourierTotal = Math.trunc(record.courierTotal);
                        newCtr = record.ctr !== null ? Math.trunc(record.ctr) : null;
                        newCommission = record.commission !== null ? Math.trunc(record.commission) : null;
                    } else if (isGlovoRecord(record)) {
                        newCourierTotal = Math.trunc(record.courierTotal);
                        newCtr = record.ctr !== null ? Math.trunc(record.ctr) : null;
                        newCommission = record.commission !== null ? Math.trunc(record.commission) : null;
                    } else if (isWoltRecord(record)) {
                        newCourierTotal = Math.trunc(record.courierTotal);
                        newCtr = record.ctr !== null ? Math.trunc(record.ctr) : null;
                        newCommission = record.commission !== null ? Math.trunc(record.commission) : null;
                    } else {
                        throw new Error("Unknown record type");
                    }

                    return { id: record.id, newCtr, newCommission, newCourierTotal };
                });

                const response = await fetch(
                    `${BASE_API}/records/bulk-update/report/${reportId}/manager-report/${managerReportId}`,
                    {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(updates)
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    console.error(error);
                    throw new Error("Failed to save changes");
                }

                setOriginalRecords(JSON.parse(JSON.stringify(records)));
                setModifiedFields({});
                showAlert("success", `Successfully saved ${modifiedFieldsCount} change${modifiedFieldsCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error("Save error:", error);
            showAlert("error", (error as Error).message || "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
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

    const formatInt = (value: number | null) => {
        if (value === null) return '-';
        return Math.round(value).toString();
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
                    <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800">
                        <MdCheck size={18} />
                    </button>
                    <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800">
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

    const renderNegroEditableCell = (
        record: NegroRecord,
        field: NegroEditingCell['field'],
        value: number | string
    ) => {
        const isEditing = negroEditingCell?.recordId === record.id && negroEditingCell?.field === field;
        const isModified = negroModifiedFields[record.id]?.[field] || false;
        const isString = field === 'compensationReason';

        if (isEditing) {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type={isString ? "text" : "number"}
                        min={isString ? undefined : 0}
                        value={negroEditingCell.value}
                        onChange={(e) => setNegroEditingCell({ ...negroEditingCell, value: e.target.value })}
                        onKeyDown={handleNegroKeyDown}
                        className={`px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isString ? 'w-40' : 'w-20'}`}
                        autoFocus
                    />
                    <button onClick={handleNegroSaveEdit} className="text-green-600 hover:text-green-800">
                        <MdCheck size={18} />
                    </button>
                    <button onClick={handleNegroCancelEdit} className="text-red-600 hover:text-red-800">
                        <MdClose size={18} />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-end gap-2 group">
                <span className={isModified ? "text-blue-600 font-semibold" : ""}>
                    {value?.toString() || '-'}
                </span>
                <button
                    onClick={() => handleNegroEditClick(record.id, field, value?.toString() || '')}
                    className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity"
                >
                    <MdEdit size={16} />
                </button>
            </div>
        );
    };

    const getTotalEarnings = () => {
        if (active === "Negro") {
            return filteredNegroRecords.reduce((sum, r) => sum + r.courierTotal, 0);
        }
        if (active === "Bolt") {
            return filteredRecords.reduce((sum, r) => {
                if (isBoltRecord(r)) return sum + r.courierTotal;
                return sum;
            }, 0);
        } else if (active === "Glovo") {
            return filteredRecords.reduce((sum, r) => {
                if (isGlovoRecord(r)) return sum + r.courierTotal;
                return sum;
            }, 0);
        } else if (active === "Wolt") {
            return filteredRecords.reduce((sum, r) => {
                if (isWoltRecord(r)) return sum + r.courierTotal;
                return sum;
            }, 0);
        }
        return 0;
    };

    const renderNegroTable = () => {
        if (negroRecords.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500">No records found</p>
                </div>
            );
        }

        console.log(filteredNegroRecords);

        return (
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium bg-purple-100 text-purple-700 uppercase tracking-wider">Owner</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bolt Earning</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Wolt Earning</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Glovo Earning</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earning</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Paid Bike<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bike Difference</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Bike from Company<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Accommodation</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Compensation<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Compensation Reason<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Manager Commission<span className="ml-1 text-blue-500 cursor-help" title="Click to edit">✎</span>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total w/o Bike Diff</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredNegroRecords.map((record) => (

                            <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium bg-purple-50 text-purple-800">{getCourierName(record.personalCourierId)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.target)}</td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    {record.accounts
                                        ? <div className="flex flex-col gap-1">
                                            {record.accounts.split('\n').filter(Boolean).map((acc, i) => (
                                                <span key={i} className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium whitespace-nowrap">
                                                    {acc.trim()}
                                                </span>
                                            ))}
                                        </div>
                                        : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.boltEarning)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.woltEarning)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.glovoEarning)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatNumber(record.totalEarning)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderNegroEditableCell(record, 'paidBike', record.paidBike)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.bikeDifference)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderNegroEditableCell(record, 'bikeFromCompany', record.bikeFromCompany)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.accommodation)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderNegroEditableCell(record, 'compensation', record.compensation)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderNegroEditableCell(record, 'compensationReason', record.compensationReason)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderNegroEditableCell(record, 'managerCommission', record.managerCommission)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.courierTotalWithoutBikeDifference)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatInt(record.courierTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">Total ({filteredNegroRecords.length} couriers)</td>
                            <td className="px-4 py-4"></td>
                            <td className="px-4 py-4"></td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatNumber(filteredNegroRecords.reduce((s, r) => s + r.boltEarning, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatNumber(filteredNegroRecords.reduce((s, r) => s + r.woltEarning, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatNumber(filteredNegroRecords.reduce((s, r) => s + r.glovoEarning, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatNumber(filteredNegroRecords.reduce((s, r) => s + r.totalEarning, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.paidBike, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.bikeDifference, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.bikeFromCompany, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.accommodation, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.compensation, 0))}
                            </td>
                            <td className="px-4 py-4"></td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.managerCommission, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatNumber(filteredNegroRecords.reduce((s, r) => s + r.courierTotalWithoutBikeDifference, 0))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatInt(filteredNegroRecords.reduce((s, r) => s + r.courierTotal, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    const renderTable = () => {
        if (loading) {
            return <div className="mt-96"><Spinner size={12} /></div>;
        }

        if (active === "Negro") {
            return renderNegroTable();
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
                                    <th className="px-6 py-3 text-left text-xs font-medium bg-purple-100 text-purple-700 uppercase tracking-wider">Owner</th>
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
                                    <th className="px-8 py-3 text-center text-xs font-medium text-indigo-600 uppercase tracking-wider min-w-[140px]">All Accts Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const order: number[] = [];
                                    const groups: Record<number, BoltRecord[]> = {};
                                    filteredRecords.forEach(r => {
                                        if (!isBoltRecord(r)) return;
                                        if (!groups[r.personalCourierId]) {
                                            groups[r.personalCourierId] = [];
                                            order.push(r.personalCourierId);
                                        }
                                        groups[r.personalCourierId].push(r);
                                    });
                                    return order.flatMap(courierId => {
                                        const group = groups[courierId];
                                        return group.map((record, i) => {
                                            const isFirst = i === 0;
                                            const groupSize = group.length;
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.rowNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.UID}</td>
                                                    {isFirst && <td rowSpan={groupSize} className="px-6 py-4 text-sm font-medium bg-purple-50 text-purple-800 align-middle">{getCourierName(record.personalCourierId)}</td>}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.firstname} {record.lastname}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.city}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatNumber(record.adjustedEarnings)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.overdueCashDebt)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.tips)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'ctr', record.ctr)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{renderEditableCell(record, 'commission', record.commission)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatInt(record.courierTotal)}</td>
                                                    {isFirst && (
                                                        <td rowSpan={groupSize} className="px-8 py-4 text-base font-bold text-indigo-700 text-center align-middle">
                                                            {groupSize > 1 ? formatInt(courierMultiAccountData.totals[record.personalCourierId]) : '-'}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        });
                                    });
                                })()}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-sm font-bold text-gray-900">Total ({filteredRecords.length} couriers)</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isBoltRecord(r) ? sum + r.adjustedEarnings : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(filteredRecords.reduce((sum, r) => isBoltRecord(r) ? sum + r.overdueCashDebt : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isBoltRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isBoltRecord(r) ? sum + r.ctr : sum, 0))}
                                    </td>
                                    <td className="px-6 py-4"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isBoltRecord(r) ? sum + r.courierTotal : sum, 0))}
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
                                    <th className="px-4 py-3 text-left text-xs font-medium bg-purple-100 text-purple-700 uppercase tracking-wider">Owner</th>
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
                                    <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider">All Accts Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const order: number[] = [];
                                    const groups: Record<number, WoltRecord[]> = {};
                                    filteredRecords.forEach(r => {
                                        if (!isWoltRecord(r)) return;
                                        if (!groups[r.personalCourierId]) {
                                            groups[r.personalCourierId] = [];
                                            order.push(r.personalCourierId);
                                        }
                                        groups[r.personalCourierId].push(r);
                                    });
                                    return order.flatMap(courierId => {
                                        const group = groups[courierId];
                                        return group.map((record, i) => {
                                            const isFirst = i === 0;
                                            const groupSize = group.length;
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                                    {isFirst && <td rowSpan={groupSize} className="px-4 py-4 text-sm font-medium bg-purple-50 text-purple-800 align-middle">{getCourierName(record.personalCourierId)}</td>}
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
                                                    {isFirst && (
                                                        <td rowSpan={groupSize} className="px-8 py-4 text-base font-bold text-indigo-700 text-center align-middle">
                                                            {groupSize > 1 ? formatInt(courierMultiAccountData.totals[record.personalCourierId]) : '-'}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        });
                                    });
                                })()}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-sm font-bold text-gray-900">Total ({filteredRecords.length} couriers)</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.taskFees : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.shiftGuarantee : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualTransactions : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.bonus : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.payoutCorrection : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.otherCost : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.additionalCompensation : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.compensationDeductions : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.operationalFeeDeduction : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.activationFeeDeduction : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualGD : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.manualGDReturn : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.cashOffset : sum, 0))}
                                    </td>
                                    <td colSpan={2} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(filteredRecords.reduce((sum, r) => isWoltRecord(r) ? sum + r.courierTotal : sum, 0))}
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
                                    <th className="px-4 py-3 text-left text-xs font-medium bg-purple-100 text-purple-700 uppercase tracking-wider">Owner</th>
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
                                    <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider">All Accts Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const order: number[] = [];
                                    const groups: Record<number, GlovoRecord[]> = {};
                                    filteredRecords.forEach(r => {
                                        if (!isGlovoRecord(r)) return;
                                        if (!groups[r.personalCourierId]) {
                                            groups[r.personalCourierId] = [];
                                            order.push(r.personalCourierId);
                                        }
                                        groups[r.personalCourierId].push(r);
                                    });
                                    return order.flatMap(courierId => {
                                        const group = groups[courierId];
                                        return group.map((record, i) => {
                                            const isFirst = i === 0;
                                            const groupSize = group.length;
                                            const total = record.total ?? calculateGlovoTotal(record.courierTotal, record.tips, record.ctr, record.commission);
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.city}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                                                    {isFirst && <td rowSpan={groupSize} className="px-4 py-4 text-sm font-medium bg-purple-50 text-purple-800 align-middle">{getCourierName(record.personalCourierId)}</td>}
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
                                                    {isFirst && (
                                                        <td rowSpan={groupSize} className="px-8 py-4 text-base font-bold text-indigo-700 text-center align-middle">
                                                            {groupSize > 1 ? formatInt(courierMultiAccountData.totals[record.personalCourierId]) : '-'}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        });
                                    });
                                })()}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={4} className="px-4 py-4 text-sm font-bold text-gray-900">Total ({filteredRecords.length} accounts)</td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.cashBalance : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.orders : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.bonus : sum, 0))}
                                    </td>
                                    <td colSpan={4} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.income : sum, 0))}
                                    </td>
                                    <td colSpan={3} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.tips : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.accountActivationFee : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatCurrency(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.appCommission : sum, 0))}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(getTotalEarnings())}
                                    </td>
                                    <td colSpan={2} className="px-4 py-4"></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {formatInt(filteredRecords.reduce((sum, r) => isGlovoRecord(r) ? sum + r.courierTotal : sum, 0))}
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
        <div className="w-full h-screen space-y-6">
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

            <div className="flex justify-between items-center gap-15">
                <div>
                    <h2 className="text-2xl font-medium">Manager Records</h2>
                    {managerName && <p className="text-sm text-gray-500 mt-1">Manager: {managerName}</p>}
                    {currentModifiedCount > 0 && (
                        <p className="text-sm text-blue-600 mt-1 font-semibold">
                            {currentModifiedCount} unsaved change{currentModifiedCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="flex-1 flex items-center gap-4">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActive("Bolt")}
                            className={`relative inline-flex items-center justify-center transition-all duration-200 ${active === "Bolt" ? "scale-110" : "scale-100 opacity-60 hover:opacity-100"}`}
                            title="Bolt Platform"
                        >
                            <img src="/bolt-1.svg" alt="Bolt" className="h-10 w-10 object-contain rounded-lg" />
                            {active === "Bolt" && (
                                <MdFiberManualRecord className="absolute -bottom-1 -right-1 text-green-500 bg-white rounded-full text-lg shadow-md" />
                            )}
                        </button>

                        <button
                            onClick={() => setActive("Wolt")}
                            className={`relative inline-flex items-center justify-center transition-all duration-200 ${active === "Wolt" ? "scale-110" : "scale-100 opacity-60 hover:opacity-100"}`}
                            title="Wolt Platform"
                        >
                            <img src="/idcxOwdB80_1769177945180.jpeg" alt="Wolt" className="h-10 w-10 object-contain rounded-lg" />
                            {active === "Wolt" && (
                                <MdFiberManualRecord className="absolute -bottom-1 -right-1 text-blue-500 bg-white rounded-full text-lg shadow-md" />
                            )}
                        </button>

                        <button
                            onClick={() => setActive("Glovo")}
                            className={`relative inline-flex items-center justify-center transition-all duration-200 ${active === "Glovo" ? "scale-110" : "scale-100 opacity-60 hover:opacity-100"}`}
                            title="Glovo Platform"
                        >
                            <img src="/idgSGGe-zp_1769177931923.jpeg" alt="Glovo" className="h-10 w-10 object-contain rounded-lg" />
                            {active === "Glovo" && (
                                <MdFiberManualRecord className="absolute -bottom-1 -right-1 text-yellow-500 bg-white rounded-full text-lg shadow-md" />
                            )}
                        </button>

                        <button
                            onClick={() => setActive("Negro")}
                            className={`relative inline-flex items-center justify-center transition-all duration-200 px-3 py-1 rounded-lg font-semibold text-sm ${active === "Negro" ? "scale-110 bg-gray-800 text-white shadow-md" : "scale-100 opacity-60 hover:opacity-100 bg-gray-200 text-gray-700"}`}
                            title="Negro Report"
                        >
                            Negro
                            {active === "Negro" && (
                                <MdFiberManualRecord className="absolute -bottom-1 -right-1 text-gray-500 bg-white rounded-full text-lg shadow-md" />
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCard(prev => !prev)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${showCard ? "bg-gray-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                        Filter by Card tag
                    </button>

                    <span className="text-sm">Total Earnings: <strong className="text-lg">{formatCurrency(getTotalEarnings())}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="success"
                        disabled={currentModifiedCount === 0 || saving}
                        onClickAction={handleSaveChanges}
                    >
                        {saving ? "Saving..." : `Save${currentModifiedCount > 0 ? ` (${currentModifiedCount})` : ''}`}
                    </Button>
                    <Button onClickAction={() => navigate(`/reports/${reportId}/reports-by-managers/${managerReportId}/transactions${managerName ? `?managerName=${managerName}` : ''}`)}>Transactions</Button>
                    <Button onClickAction={() => navigate(-1)}>Back</Button>
                </div>

            </div>
            <div className="flex items-center gap-4">
                <Input
                    inputValue={searchTerm}
                    nameValue="search"
                    type="text"
                    placeholderValue="Search by courier name..."
                    onChangeAction={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {renderTable()}
        </div>
    );
};

export default ManagerRecordsDetail;
