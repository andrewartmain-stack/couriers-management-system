import { useMemo, useState, useEffect, useRef, type FC } from "react";
import { MdCheck } from "react-icons/md";

import Button from "./Button";
import Input from "./Input";

import type { Courier } from "../types";

interface AddAccountModalPropsInterface {
    onClose: () => void;
    addAccount: (
        courierId: number,
        platform: "BOLT" | "WOLT" | "GLOVO",
        status: "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN",
        accountUID: string,
        accountName: string,
        phoneNumber: string,
        email: string,
    ) => void;
    couriersData: Courier[];
    validationErrors: Record<string, string> | null;
}

export const AddAccountModal: FC<AddAccountModalPropsInterface> = ({
    onClose,
    addAccount,
    couriersData,
    validationErrors,
}) => {
    const [courierId, setCourierId] = useState<number | undefined>(undefined);
    const [courierSearch, setCourierSearch] = useState<string>('');
    const [platform, setPlatform] = useState<"BOLT" | "WOLT" | "GLOVO">("BOLT");
    const [status, setStatus] = useState<"BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN">("ACTIVE");
    const [accountUID, setAccountUID] = useState<string>("");
    const [accountName, setAccountName] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const platformDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target as Node)) {
                setPlatformDropdownOpen(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCouriers = useMemo(() => {
        const term = courierSearch.trim().toLowerCase();
        if (!term) return couriersData;

        return couriersData.filter((courier) =>
            `${courier.firstname} ${courier.lastname}`.toLowerCase().includes(term) ||
            courier.phoneNumber?.toLowerCase().includes(term) ||
            courier.nationality?.toLowerCase().includes(term)
        );
    }, [couriersData, courierSearch]);

    const handleSubmit = () => {
        if (!courierId) return;
        addAccount(
            courierId,
            platform,
            status,
            accountUID.trim(),
            accountName.trim(),
            phoneNumber.trim(),
            email.trim()
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute h-screen inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Add Account</h2>

                <div className="flex flex-col gap-4">
                    {/* Courier Select */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="courierSearch" className="text-sm font-medium">
                            Courier <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="courierSearch"
                            type="text"
                            placeholder="Search couriers..."
                            value={courierSearch}
                            onChange={(e) => setCourierSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {filteredCouriers.length === 0 ? (
                                <p className="text-sm text-gray-500 p-4 text-center">No couriers found</p>
                            ) : (
                                filteredCouriers.map((courier) => (
                                    <button
                                        key={courier.id}
                                        type="button"
                                        onClick={() => setCourierId(courier.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${courierId === courier.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <span className="text-sm font-medium text-gray-900">{courier.firstname} {courier.lastname}</span>
                                        {courierId === courier.id && <MdCheck size={18} className="text-blue-600" />}
                                    </button>
                                ))
                            )}
                        </div>
                        {validationErrors?.courierId && (
                            <p className="text-red-400 text-sm">{validationErrors.courierId}</p>
                        )}
                    </div>

                    {/* Platform Dropdown */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">
                            Platform <span className="text-red-500">*</span>
                        </label>
                        <div className="relative" ref={platformDropdownRef}>
                            <button
                                onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                {platform}
                            </button>
                            {platformDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 min-w-full">
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {['BOLT', 'WOLT', 'GLOVO'].map((option) => (
                                            <label key={option} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                <input
                                                    type="radio"
                                                    checked={platform === option}
                                                    onChange={() => { setPlatform(option as "BOLT" | "WOLT" | "GLOVO"); setPlatformDropdownOpen(false); }}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {validationErrors?.platform && (
                            <p className="text-red-400 text-sm">{validationErrors.platform}</p>
                        )}
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <div className="relative" ref={statusDropdownRef}>
                            <button
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                {status}
                            </button>
                            {statusDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 min-w-full">
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {['ACTIVE', 'BLOCKED', 'DELETED', 'UNKNOWN'].map((option) => (
                                            <label key={option} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                <input
                                                    type="radio"
                                                    checked={status === option}
                                                    onChange={() => { setStatus(option as "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN"); setStatusDropdownOpen(false); }}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {validationErrors?.status && (
                            <p className="text-red-400 text-sm">{validationErrors.status}</p>
                        )}
                    </div>

                    {/* Account UID */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="accountUID" className="text-sm font-medium">
                            Account UID <span className="text-red-500">*</span>
                        </label>
                        <Input
                            nameValue="accountUID"
                            placeholderValue="BOLT_12345"
                            inputValue={accountUID}
                            onChangeAction={(e: any) => setAccountUID(e.target.value)}
                            required
                        />
                        {validationErrors?.accountUID && (
                            <p className="text-red-400 text-sm">{validationErrors.accountUID}</p>
                        )}
                    </div>

                    {/* Account Name */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="accountName" className="text-sm font-medium">
                            Account Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            nameValue="accountName"
                            placeholderValue="John Doe - Bolt"
                            inputValue={accountName}
                            onChangeAction={(e: any) => setAccountName(e.target.value)}
                            required
                        />
                        {validationErrors?.accountName && (
                            <p className="text-red-400 text-sm">{validationErrors.accountName}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="phoneNumber" className="text-sm font-medium">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                            nameValue="phoneNumber"
                            placeholderValue="+40712345678"
                            inputValue={phoneNumber}
                            onChangeAction={(e: any) => setPhoneNumber(e.target.value)}
                            required
                        />
                        {validationErrors?.phoneNumber && (
                            <p className="text-red-400 text-sm">{validationErrors.phoneNumber}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            nameValue="email"
                            placeholderValue="john.doe@bolt.com"
                            inputValue={email}
                            onChangeAction={(e: any) => setEmail(e.target.value)}
                            required
                        />
                        {validationErrors?.email && (
                            <p className="text-red-400 text-sm">{validationErrors.email}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button onClickAction={onClose} variant="error">
                        Cancel
                    </Button>
                    <Button onClickAction={handleSubmit}>Save</Button>
                </div>
            </div>
        </div>
    );
};