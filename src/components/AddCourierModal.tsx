import { useEffect, useState, useRef, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

import type { City, Manager, Tag } from '../types/index'


interface AddCourierModalPropsInterface {
    onClose: () => void;
    addCourier: (firstName: string, lastName: string, phoneNumber: string, nationality: string, cityId: number | undefined, managerId: number | undefined, ctr: number, commission: number, tagsId: number[], cnp: string, trcFile: File | null) => void;
    managersData: Manager[];
    citiesData: City[];
    tagsData: Tag[];
    validationErrors: Record<string, string> | null
}

export const AddCourierModal: FC<AddCourierModalPropsInterface> = ({ onClose, addCourier, managersData, citiesData, tagsData, validationErrors }) => {

    const isAdmin = localStorage.getItem('user_role') === 'ROLE_ADMIN';
    const storedManagerId = localStorage.getItem('manager_id');

    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [firstNameInput, setFirstNameInput] = useState<string>('');
    const [lastNameInput, setLastNameInput] = useState<string>('');
    const [nationalityInput, setNationalityInput] = useState<string>('');
    const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
    const [cnpInput, setCnpInput] = useState<string>('');
    const [trcFile, setTrcFile] = useState<File | null>(null);
    const [ctrInput, setCtrInput] = useState<string>('');
    const [commissionInput, setCommissionInput] = useState<string>('');
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const managerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setCityDropdownOpen(false);
            }
            if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target as Node)) {
                setManagerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setSelectedCity(citiesData[0]);
        if (isAdmin) {
            setSelectedManager(managersData[0]);
        } else {
            const myManager = managersData.find(m => m.id === Number(storedManagerId));
            setSelectedManager(myManager ?? null);
        }
    }, [])

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
                    Add Courier
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

                    <label htmlFor="cnp" className="text-sm -mb-1.25">CNP <span className="text-gray-400">(Optional)</span></label>
                    <Input nameValue="cnp" placeholderValue="1234567890123" inputValue={cnpInput} onChangeAction={(e: any) => setCnpInput(e.target.value)} />
                    {validationErrors?.cnp && <p className="text-red-400 text-sm">{validationErrors.cnp}</p>}

                    <label htmlFor="trc" className="text-sm -mb-1.25">TRC Document <span className="text-gray-400">(Optional)</span></label>
                    <input
                        id="trc"
                        name="trc"
                        type="file"
                        onChange={(e) => setTrcFile(e.target.files?.[0] ?? null)}
                        className="bg-gray-100 border border-transparent rounded-full py-2.5 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
                    />

                    <label htmlFor="ctr" className="text-sm -mb-1.25">CTR</label>
                    <Input nameValue="ctr" placeholderValue="90" inputValue={ctrInput} onChangeAction={(e: any) => setCtrInput(e.target.value)} type="number" required />
                    {validationErrors?.ctr && <p className="text-red-400 text-sm">{validationErrors.ctr}</p>}

                    <label htmlFor="commission" className="text-sm -mb-1.25">Commission</label>
                    <Input nameValue="commission" placeholderValue="5" inputValue={commissionInput} onChangeAction={(e: any) => setCommissionInput(e.target.value)} type="number" required />
                    {validationErrors?.commission && <p className="text-red-400 text-sm">{validationErrors.commission}</p>}

                    <label className="text-sm -mb-1.25">Select City</label>
                    <div className="relative" ref={cityDropdownRef}>
                        <button
                            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                            className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm text-left transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none hover:border-gray-300"
                        >
                            {selectedCity?.name || 'Select city'}
                        </button>
                        {cityDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 min-w-full">
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {citiesData.map((city) => (
                                        <label key={city.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                            <input
                                                type="radio"
                                                checked={selectedCity?.id === city.id}
                                                onChange={() => { setSelectedCity(city); setCityDropdownOpen(false); }}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">{city.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <>
                            <label className="text-sm -mb-1.25">Select Manager</label>
                            <div className="relative" ref={managerDropdownRef}>
                                <button
                                    onClick={() => setManagerDropdownOpen(!managerDropdownOpen)}
                                    className="w-full bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm text-left transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none hover:border-gray-300"
                                >
                                    {selectedManager ? `${selectedManager.firstname} ${selectedManager.lastname}` : 'Select Manager'}
                                </button>
                                {managerDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 min-w-full">
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {managersData.map((manager) => (
                                                <label key={manager.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="radio"
                                                        checked={selectedManager?.id === manager.id}
                                                        onChange={() => { setSelectedManager(manager); setManagerDropdownOpen(false); }}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-gray-700">{manager.firstname} {manager.lastname}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                        variant="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => addCourier(
                            firstNameInput.trim(),
                            lastNameInput.trim(),
                            phoneNumberInput.trim(),
                            nationalityInput.trim(),
                            selectedCity?.id,
                            selectedManager?.id,
                            Number(ctrInput),
                            Number(commissionInput),
                            selectedTags,
                            cnpInput.trim(),
                            trcFile
                        )}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};