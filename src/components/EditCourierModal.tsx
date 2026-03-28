import { useEffect, useState, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

import type { City, Manager, Tag, Courier } from '../types/index'

interface EditCourierModalPropsInterface {
    onClose: () => void;
    editCourier: (
        courierId: number,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        nationality: string,
        cityId: number | undefined,
        managerId: number | undefined,
        ctr: number,
        commission: number,
        tagsId: number[]
    ) => void;
    courier: Courier;
    managersData: Manager[];
    citiesData: City[];
    tagsData: Tag[];
    validationErrors: Record<string, string> | null;
}

export const EditCourierModal: FC<EditCourierModalPropsInterface> = ({
    onClose,
    editCourier,
    courier,
    managersData,
    citiesData,
    tagsData,
    validationErrors
}) => {
    const isAdmin = localStorage.getItem('user_role') === 'ROLE_ADMIN';
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [firstNameInput, setFirstNameInput] = useState<string>('');
    const [lastNameInput, setLastNameInput] = useState<string>('');
    const [nationalityInput, setNationalityInput] = useState<string>('');
    const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
    const [ctrInput, setCtrInput] = useState<string>('');
    const [commissionInput, setCommissionInput] = useState<string>('');

    useEffect(() => {
        // Pre-fill form with courier data
        setFirstNameInput(courier.firstname);
        setLastNameInput(courier.lastname);
        setPhoneNumberInput(courier.phoneNumber);
        setNationalityInput(courier.nationality);
        setCtrInput(courier.ctr.toString());
        setCommissionInput(courier.commission.toString());
        setSelectedTags(courier.tagIds || []);

        // Set selected city
        const city = citiesData.find(c => c.id === courier.cityId);
        if (city) setSelectedCity(city);

        // Set selected manager
        const manager = managersData.find(m => m.id === courier.managerId);
        if (manager) setSelectedManager(manager);
    }, [courier, citiesData, managersData]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute h-screen inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 h-[700px] overflow-y-scroll">
                <h2 className="text-lg font-semibold mb-4">
                    Edit Courier
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="firstname" className="text-sm -mb-1.25">First Name</label>
                    <Input nameValue="firstname" placeholderValue="Mohammed" inputValue={firstNameInput} onChangeAction={(e: any) => setFirstNameInput(e.target.value)} required />
                    {validationErrors?.firstname && <p className="text-red-400 text-sm">{validationErrors.firstname}</p>}

                    <label htmlFor="lastname" className="text-sm -mb-1.25">Last Name</label>
                    <Input nameValue="lastname" placeholderValue="Abdul" inputValue={lastNameInput} onChangeAction={(e: any) => setLastNameInput(e.target.value)} required />
                    {validationErrors?.lastname && <p className="text-red-400 text-sm">{validationErrors.lastname}</p>}

                    <label htmlFor="phoneNumber" className="text-sm -mb-1.25">Phone</label>
                    <Input nameValue="phoneNumber" placeholderValue="+40720675790" inputValue={phoneNumberInput} onChangeAction={(e: any) => setPhoneNumberInput(e.target.value)} type="tel" required />
                    {validationErrors?.phoneNumber && <p className="text-red-400 text-sm">{validationErrors.phoneNumber}</p>}

                    <label htmlFor="nationality" className="text-sm -mb-1.25">Nationality</label>
                    <Input nameValue="nationality" placeholderValue="Romanian" inputValue={nationalityInput} onChangeAction={(e: any) => setNationalityInput(e.target.value)} required />
                    {validationErrors?.nationality && <p className="text-red-400 text-sm">{validationErrors.nationality}</p>}

                    <label htmlFor="ctr" className="text-sm -mb-1.25">CTR</label>
                    <Input nameValue="ctr" placeholderValue="90" inputValue={ctrInput} onChangeAction={(e: any) => setCtrInput(e.target.value)} type="number" required />
                    {validationErrors?.ctr && <p className="text-red-400 text-sm">{validationErrors.ctr}</p>}

                    <label htmlFor="commission" className="text-sm -mb-1.25">Commission</label>
                    <Input nameValue="commission" placeholderValue="5" inputValue={commissionInput} onChangeAction={(e: any) => setCommissionInput(e.target.value)} type="number" required />
                    {validationErrors?.commission && <p className="text-red-400 text-sm">{validationErrors.commission}</p>}

                    <label htmlFor="city" className="text-sm -mb-1.25">Select City</label>
                    <select
                        name="city"
                        value={selectedCity?.name || ''}
                        onChange={(e) => {
                            const city = citiesData.find(city => city.name === e.target.value);
                            if (city) setSelectedCity(city);
                        }}
                        required
                        className="bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none"
                    >
                        <option value="" disabled>
                            Select city
                        </option>
                        {citiesData.map((city) => (
                            <option key={city.id} value={city.name}>
                                {city.name}
                            </option>
                        ))}
                    </select>

                    {isAdmin && (
                        <>
                            <label htmlFor="manager" className="text-sm -mb-1.25">Select Manager</label>
                            <select
                                name="manager"
                                value={selectedManager ? `${selectedManager.firstname} ${selectedManager.lastname}` : ''}
                                onChange={(e) => {
                                    const manager = managersData.find(manager => `${manager.firstname} ${manager.lastname}` === e.target.value);
                                    if (manager) setSelectedManager(manager);
                                }}
                                required
                                className="bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none"
                            >
                                <option value="" disabled>Select Manager</option>
                                {managersData.map((manager) => (
                                    <option key={manager.id} value={`${manager.firstname} ${manager.lastname}`}>
                                        {manager.firstname} {manager.lastname}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <label htmlFor="tags" className="text-sm -mb-1.25">Tags (Optional)</label>
                    <div className="bg-gray-100 border border-transparent rounded-2xl py-3 px-4">
                        {tagsData.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tagsData.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleTagToggle(tag.id)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedTags.includes(tag.id)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No tags available</p>
                        )}
                    </div>
                    {selectedTags.length > 0 && (
                        <p className="text-xs text-gray-600">
                            {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        type="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => editCourier(
                            courier.id,
                            firstNameInput.trim(),
                            lastNameInput.trim(),
                            phoneNumberInput.trim(),
                            nationalityInput.trim(),
                            selectedCity?.id,
                            selectedManager?.id,
                            Number(ctrInput),
                            Number(commissionInput),
                            selectedTags
                        )}
                    >
                        Update
                    </Button>
                </div>
            </div>
        </div>
    );
};