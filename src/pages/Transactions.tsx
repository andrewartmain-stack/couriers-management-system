import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MdError, MdCheckCircle, MdDelete, MdEdit, MdCheck, MdClose, MdUpload, MdDownload } from "react-icons/md";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import { getAuthHeaders, getAuthHeadersNoContentType, BASE_URL } from "../utils/index";

interface Transaction {
    id: number;
    managerReportId: number;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
}

interface TransactionFile {
    id: number;
    originalFileName: string;
    storedFileName: string;
    fileUrl: string;
    contentType: string;
    size: number;
    transactionId: number;
}

const Transactions = () => {
    const { managerId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const managerName = searchParams.get("managerName");

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [files, setFiles] = useState<Record<number, TransactionFile | null>>({});
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ isActive: boolean; type: "error" | "success"; message: string }>({
        isActive: false, type: "error", message: "",
    });

    const [showForm, setShowForm] = useState(false);
    const [newType, setNewType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [newAmount, setNewAmount] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [creating, setCreating] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [editAmount, setEditAmount] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [editTypeDropdownOpen, setEditTypeDropdownOpen] = useState(false);
    const [formTypeDropdownOpen, setFormTypeDropdownOpen] = useState(false);
    const editTypeDropdownRef = useRef<HTMLDivElement>(null);
    const formTypeDropdownRef = useRef<HTMLDivElement>(null);

    const showAlert = (type: "error" | "success", message: string) => {
        setAlert({ isActive: true, type, message });
        setTimeout(() => setAlert(prev => ({ ...prev, isActive: false })), 3000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editTypeDropdownRef.current && !editTypeDropdownRef.current.contains(event.target as Node)) {
                setEditTypeDropdownOpen(false);
            }
            if (formTypeDropdownRef.current && !formTypeDropdownRef.current.contains(event.target as Node)) {
                setFormTypeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/api/transactions/managerReport/${managerId}`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error("Failed to fetch transactions");
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [managerId]);

    useEffect(() => {
        if (transactions.length === 0) return;

        transactions.forEach(t => {
            fetch(`${BASE_URL}/api/files/transaction/${t.id}`, {
                headers: getAuthHeadersNoContentType(),
            })
                .then(res => (res.ok ? res.json() : null))
                .then(data => setFiles(prev => ({ ...prev, [t.id]: data ?? null })))
                .catch(() => setFiles(prev => ({ ...prev, [t.id]: null })));
        });
    }, [transactions]);

    const handleCreate = async () => {
        if (!newAmount || !newDescription.trim()) {
            showAlert("error", "Amount and description are required");
            return;
        }
        const amount = parseFloat(newAmount);
        if (isNaN(amount) || amount <= 0) {
            showAlert("error", "Amount must be a positive number");
            return;
        }
        try {
            setCreating(true);
            const response = await fetch(`${BASE_URL}/api/transactions`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ managerReportId: Number(managerId), type: newType, amount, description: newDescription }),
            });
            if (!response.ok) throw new Error("Failed to create transaction");
            setNewType("EXPENSE");
            setNewAmount("");
            setNewDescription("");
            setShowForm(false);
            showAlert("success", "Transaction created");
            fetchTransactions();
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        } finally {
            setCreating(false);
        }
    };

    const startEdit = (t: Transaction) => {
        setEditingId(t.id);
        setEditType(t.type);
        setEditAmount(String(t.amount));
        setEditDescription(t.description);
    };

    const handleSaveEdit = async () => {
        if (!editAmount || !editDescription.trim()) {
            showAlert("error", "Amount and description are required");
            return;
        }
        const amount = parseFloat(editAmount);
        if (isNaN(amount) || amount <= 0) {
            showAlert("error", "Amount must be a positive number");
            return;
        }
        try {
            setSaving(true);
            const response = await fetch(`${BASE_URL}/api/transactions/${editingId}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ type: editType, amount, description: editDescription }),
            });
            if (!response.ok) throw new Error("Failed to update transaction");
            setEditingId(null);
            showAlert("success", "Transaction updated");
            fetchTransactions();
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this transaction?")) return;
        try {
            await fetch(`${BASE_URL}/api/transactions/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            showAlert("success", "Transaction deleted");
            fetchTransactions();
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        }
    };

    const handleUploadFile = async (transactionId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            setUploadingId(transactionId);
            const response = await fetch(`${BASE_URL}/api/files/upload-transaction-file/transaction/${transactionId}`, {
                method: "POST",
                headers: getAuthHeadersNoContentType(),
                body: formData,
            });
            if (!response.ok) throw new Error("File upload failed");
            const data = await response.json();
            setFiles(prev => ({ ...prev, [transactionId]: data }));
            showAlert("success", "File uploaded");
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        } finally {
            setUploadingId(null);
        }
    };

    const handleDownload = async (fileUrl: string, originalFileName: string) => {

        console.log(fileUrl)

        try {
            const response = await fetch(`${BASE_URL}/api/files/download-transaction-file?file-url=${fileUrl}`, {
                headers: getAuthHeadersNoContentType(),
            });
            if (!response.ok) throw new Error("File not found");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = originalFileName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            if (error instanceof Error) showAlert("error", error.message);
        }
    };

    const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="w-full h-full space-y-6">

            {/* Alert */}
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
                            <p className="text-sm font-semibold leading-snug">{alert.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-medium">Transactions</h2>
                    {managerName && <p className="text-sm text-gray-500 mt-1">Manager: {managerName}</p>}
                </div>
                <div className="flex items-center gap-10">
                    {transactions.length > 0 && (
                        <>
                            <span>Total Income: <strong>{totalIncome.toFixed(2)}</strong></span>
                            <span>Total Expense: <strong>{totalExpense.toFixed(2)}</strong></span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="success" onClickAction={() => setShowForm(v => !v)}>
                        {showForm ? "Cancel" : "+ Add Transaction"}
                    </Button>
                    <Button onClickAction={() => navigate(-1)}>Back</Button>
                </div>
            </div>

            {/* New Transaction Form */}
            {showForm && (
                <div className="flex gap-4 items-center py-2">
                    <div className="relative" ref={formTypeDropdownRef}>
                        <button
                            onClick={() => setFormTypeDropdownOpen(!formTypeDropdownOpen)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            {newType}
                        </button>
                        {formTypeDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 min-w-40">
                                <div className="space-y-2">
                                    {['INCOME', 'EXPENSE'].map(type => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                            <input
                                                type="radio"
                                                checked={newType === (type as "INCOME" | "EXPENSE")}
                                                onChange={() => { setNewType(type as "INCOME" | "EXPENSE"); setFormTypeDropdownOpen(false); }}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        className="bg-transparent text-sm text-gray-700 placeholder-gray-400 w-28 focus:outline-none border-b border-gray-300 focus:border-gray-600 pb-0.5 transition-colors"
                    />
                    <div className="w-px h-4 bg-gray-200" />
                    <input
                        type="text"
                        placeholder="Description"
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        maxLength={255}
                        className="bg-transparent text-sm text-gray-700 placeholder-gray-400 flex-1 focus:outline-none border-b border-gray-300 focus:border-gray-600 pb-0.5 transition-colors"
                    />
                    <Button variant="success" disabled={creating} onClickAction={handleCreate}>
                        {creating ? "Creating..." : "Create"}
                    </Button>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
            ) : transactions.length === 0 ? (
                <div className="text-gray-500 text-sm">No transactions found for this manager report.</div>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.id}</td>

                                    {editingId === t.id ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative" ref={editTypeDropdownRef}>
                                                    <button
                                                        onClick={() => setEditTypeDropdownOpen(!editTypeDropdownOpen)}
                                                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                                    >
                                                        {editType}
                                                    </button>
                                                    {editTypeDropdownOpen && (
                                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-2 min-w-40">
                                                            <div className="space-y-1">
                                                                {['INCOME', 'EXPENSE'].map(type => (
                                                                    <label key={type} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                                        <input
                                                                            type="radio"
                                                                            checked={editType === (type as "INCOME" | "EXPENSE")}
                                                                            onChange={() => { setEditType(type as "INCOME" | "EXPENSE"); setEditTypeDropdownOpen(false); }}
                                                                            className="w-4 h-4 cursor-pointer"
                                                                        />
                                                                        <span className="text-sm text-gray-700">{type}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={e => setEditAmount(e.target.value)}
                                                    min="0.01"
                                                    step="0.01"
                                                    className="border rounded px-2 py-1 text-sm w-28 text-right"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={e => setEditDescription(e.target.value)}
                                                    maxLength={255}
                                                    className="border rounded px-2 py-1 text-sm w-full min-w-48"
                                                />
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{t.description}</td>
                                        </>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {uploadingId === t.id ? (
                                            <span className="text-xs text-gray-400">Uploading...</span>
                                        ) : files[t.id] ? (
                                            <button
                                                onClick={() => handleDownload(files[t.id]!.fileUrl, files[t.id]!.originalFileName)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                                <MdDownload size={14} /> {files[t.id]!.originalFileName}
                                            </button>
                                        ) : (
                                            <label className="flex items-center gap-1 text-gray-400 hover:text-gray-600 cursor-pointer text-xs">
                                                <MdUpload size={14} />
                                                <span>Upload</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUploadFile(t.id, file);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {editingId === t.id ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={saving}
                                                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                                    >
                                                        <MdCheck size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        <MdClose size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(t)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        <MdEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <MdDelete size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                                    Total ({transactions.length} transaction{transactions.length !== 1 ? "s" : ""})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    {transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                                </td>
                                <td colSpan={3} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Transactions;
