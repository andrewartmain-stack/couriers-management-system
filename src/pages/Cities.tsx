import { useState } from "react";
import { MdError } from "react-icons/md";
import { AddCityModal } from "../components/AddCityModal";
import Card from "../components/Card";
import { useAppData } from '../context/AppContext';
import { getAuthHeaders, BASE_API } from '../utils/index';

const Cities = () => {
    const { cities, couriers, refresh } = useAppData();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
    const [alert, setAlert] = useState<{ on: boolean; type: 'error' | 'success'; msg: string }>({
        on: false, type: 'error', msg: '',
    });

    const showAlert = (type: 'error' | 'success', msg: string) => {
        setAlert({ on: true, type, msg });
        setTimeout(() => setAlert(a => ({ ...a, on: false })), 3000);
    };

    const addCity = async (name: string) => {
        if (!name) return showAlert('error', 'Please complete name field');
        try {
            const res = await fetch(`${BASE_API}/cities`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                refresh();
                showAlert('success', 'City was added successfully');
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
        <div className="w-full h-full space-y-6">
            {alert.on && (
                <div className={`fixed top-5 right-5 z-100 max-w-sm w-full shadow-xl rounded-2xl p-4 animate-toast
                    ${alert.type === 'error' ? 'bg-[var(--error-bg)] text-[var(--error-text)]' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-start gap-3">
                        <MdError className={`mt-0.5 text-lg ${alert.type === 'error' ? 'text-red-500' : 'text-green-500'}`} />
                        <p className="text-sm font-semibold leading-snug">{alert.msg}</p>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <AddCityModal
                    onClose={() => { setIsAddOpen(false); setValidationErrors(null); }}
                    addCity={addCity}
                    validationErrors={validationErrors}
                />
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold tracking-tight">Cities</h2>
            </div>

            <div className="flex gap-4 flex-wrap">
                {cities.map(city => (
                    <Card key={city.id} type="dark" className="w-72">
                        <div className="flex flex-col justify-between h-full">
                            <div className="font-medium text-2xl">{city.name}</div>
                            <div className="font-medium text-sm">
                                Active Couriers: {couriers.filter(c => c.cityId === city.id).length}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Cities;