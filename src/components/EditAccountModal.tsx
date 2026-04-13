import { useEffect, useMemo, useState, type FC } from "react";
import { MdCheck } from "react-icons/md";

import Button from "./Button";
import Input from "./Input";

import type { Account, Courier } from '../types/index'

interface EditAccountModalPropsInterface {
    onClose: () => void;
    editAccount: (
        accountId: number,
        courierId: number,
        platform: "BOLT" | "WOLT" | "GLOVO",
        status: "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN",
        accountUID: string,
        accountName: string,
        phoneNumber: string,
        email: string
    ) => void;
    account: Account;
    couriersData: Courier[];
    validationErrors: Record<string, string> | null;
}

export const EditAccountModal: FC<EditAccountModalPropsInterface> = ({
    onClose,
    editAccount,
    account,
    couriersData,
    validationErrors
}) => {
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
    const [courierSearch, setCourierSearch] = useState<string>('');
    const [selectedPlatform, setSelectedPlatform] = useState<"BOLT" | "WOLT" | "GLOVO">("BOLT");
    const [selectedStatus, setSelectedStatus] = useState<"BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN">("ACTIVE");
    const [accountUIDInput, setAccountUIDInput] = useState<string>('');
    const [accountNameInput, setAccountNameInput] = useState<string>('');
    const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
    const [emailInput, setEmailInput] = useState<string>('');

    const filteredCouriers = useMemo(() => {
        const term = courierSearch.trim().toLowerCase();
        if (!term) return couriersData;

        return couriersData.filter((courier) =>
            `${courier.firstname} ${courier.lastname}`.toLowerCase().includes(term) ||
            courier.phoneNumber?.toLowerCase().includes(term) ||
            courier.nationality?.toLowerCase().includes(term)
        );
    }, [couriersData, courierSearch]);

    useEffect(() => {
        // Pre-fill form with account data
        setAccountUIDInput(account.accountUID);
        setAccountNameInput(account.accountName);
        setPhoneNumberInput(account.phoneNumber);
        setEmailInput(account.email);
        setSelectedPlatform(account.platform as "BOLT" | "WOLT" | "GLOVO");
        setSelectedStatus(account.status as "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN");

        // Set selected courier
        const courier = couriersData.find(c => c.id === account.courierId);
        if (courier) setSelectedCourier(courier);
    }, [account, couriersData]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute h-screen inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[700px] overflow-y-scroll">
                <h2 className="text-lg font-semibold mb-4">
                    Edit Account
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="courierSearch" className="text-sm -mb-1.25">Assign to Courier</label>
                    <input
                        id="courierSearch"
                        type="text"
                        placeholder="Search couriers..."
                        value={courierSearch}
                        onChange={(e) => setCourierSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {filteredCouriers.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4 text-center">No couriers found</p>
                        ) : (
                            filteredCouriers.map(courier => (
                                <button
                                    key={courier.id}
                                    type="button"
                                    onClick={() => setSelectedCourier(courier)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedCourier === courier ? 'bg-blue-50' : ''}`}
                                >
                                    <span className="text-sm font-medium text-gray-900">{courier.firstname} {courier.lastname}</span>
                                    {selectedCourier === courier && <MdCheck size={18} className="text-blue-600" />}
                                </button>
                            ))
                        )}
                    </div>
                    {validationErrors?.courierId && <p className="text-red-400 text-sm">{validationErrors.courierId}</p>}

                    <label htmlFor="platform" className="text-sm -mb-1.25">Platform</label>
                    <select
                        name="platform"
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value as "BOLT" | "WOLT" | "GLOVO")}
                        required
                        className="bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none"
                    >
                        <option value="BOLT">Bolt</option>
                        <option value="WOLT">Wolt</option>
                        <option value="GLOVO">Glovo</option>
                    </select>
                    {validationErrors?.platform && <p className="text-red-400 text-sm">{validationErrors.platform}</p>}

                    <label htmlFor="status" className="text-sm -mb-1.25">Status</label>
                    <select
                        name="status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN")}
                        required
                        className="bg-gray-100 border border-transparent rounded-full py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none"
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="DELETED">Deleted</option>
                        <option value="UNKNOWN">Unknown</option>
                    </select>
                    {validationErrors?.status && <p className="text-red-400 text-sm">{validationErrors.status}</p>}

                    <label htmlFor="accountUID" className="text-sm -mb-1.25">Account UID</label>
                    <Input
                        nameValue="accountUID"
                        placeholderValue="BOLT123456"
                        inputValue={accountUIDInput}
                        onChangeAction={(e: any) => setAccountUIDInput(e.target.value)}
                        required
                    />
                    {validationErrors?.accountUID && <p className="text-red-400 text-sm">{validationErrors.accountUID}</p>}

                    <label htmlFor="accountName" className="text-sm -mb-1.25">Account Name</label>
                    <Input
                        nameValue="accountName"
                        placeholderValue="John Doe"
                        inputValue={accountNameInput}
                        onChangeAction={(e: any) => setAccountNameInput(e.target.value)}
                        required
                    />
                    {validationErrors?.accountName && <p className="text-red-400 text-sm">{validationErrors.accountName}</p>}

                    <label htmlFor="phoneNumber" className="text-sm -mb-1.25">Phone Number</label>
                    <Input
                        nameValue="phoneNumber"
                        placeholderValue="+40720675790"
                        inputValue={phoneNumberInput}
                        onChangeAction={(e: any) => setPhoneNumberInput(e.target.value)}
                        type="tel"
                        required
                    />
                    {validationErrors?.phoneNumber && <p className="text-red-400 text-sm">{validationErrors.phoneNumber}</p>}

                    <label htmlFor="email" className="text-sm -mb-1.25">Email</label>
                    <Input
                        nameValue="email"
                        placeholderValue="example@email.com"
                        inputValue={emailInput}
                        onChangeAction={(e: any) => setEmailInput(e.target.value)}
                        type="email"
                        required
                    />
                    {validationErrors?.email && <p className="text-red-400 text-sm">{validationErrors.email}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        variant="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => editAccount(
                            account.id,
                            selectedCourier?.id || 0,
                            selectedPlatform,
                            selectedStatus,
                            accountUIDInput.trim(),
                            accountNameInput.trim(),
                            phoneNumberInput.trim(),
                            emailInput.trim()
                        )}
                    >
                        Update
                    </Button>
                </div>
            </div>
        </div>
    );
};