import { useState } from "react";
import { MdError, MdCheckCircle } from "react-icons/md";
import Card from "../components/Card";
import { AddManagerModal } from "../components/AddManagerModal";
import { useAppData } from '../context/AppContext';
import { getAuthHeaders, BASE_API } from '../utils/index';

const Managers = () => {
    const { managers, refresh } = useAppData();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    const addManager = async (firstName: string, lastName: string, phoneNumber: string, email: string, prefix: string, commission: number) => {
        if (!firstName || !lastName || !phoneNumber || !email || !prefix || isNaN(commission))
            return showAlert('error', 'Please complete all the fields');
        try {
            const res = await fetch(`${BASE_API}/managers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ firstname: firstName, lastname: lastName, phoneNumber, email, prefix, managerCommission: commission }),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'Manager added successfully');
                setIsAddOpen(false);
                setValidationErrors(null);
            } else {
                const err = await res.json();
                setValidationErrors(err.validationErrors);
                showAlert('error', err.message || 'Something went wrong');
            }
        } catch (e: any) { showAlert('error', e.message); }
    };

    return (
        <div className="w-full min-h-screen space-y-6">
            {alert.on && (
                <div className={`fixed top-6 right-6 z-50 w-full max-w-sm rounded-xl p-4 shadow-2xl
                    ${alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-center gap-3">
                        {alert.type === 'error' ? <MdError className="text-xl" /> : <MdCheckCircle className="text-xl" />}
                        <p className="text-sm font-semibold">{alert.msg}</p>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <AddManagerModal
                    onClose={() => { setIsAddOpen(false); setValidationErrors(null); }}
                    addManager={addManager}
                    validationErrors={validationErrors}
                />
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold tracking-tight">Managers</h2>
            </div>

            {managers.length === 0 ? (
                <div className="text-gray-500 text-sm">No managers yet. Add your first one.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managers.map(manager => (
                        <Card key={manager.id} type="light" className="relative p-6 transition duration-200 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-5">
                                <div>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {manager.firstname} {manager.lastname}
                                    </div>
                                    <div className="text-sm text-gray-500">{manager.email}</div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phone</span>
                                    <span>{manager.phoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Prefix</span>
                                    <span>{manager.prefix}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Commission</span>
                                    <span>{manager.managerCommission}%</span>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t text-xs text-gray-500 space-y-1">
                                <div>Created: {new Date(manager.createdAt).toLocaleDateString('en-GB')}</div>
                                <div>Updated: {new Date(manager.updatedAt).toLocaleDateString('en-GB')}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Managers;