import { useState, type FC } from "react";

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
    const [platform, setPlatform] = useState<"BOLT" | "WOLT" | "GLOVO">("BOLT");
    const [status, setStatus] = useState<"BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN">("ACTIVE");
    const [accountUID, setAccountUID] = useState<string>("");
    const [accountName, setAccountName] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [email, setEmail] = useState<string>("");

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
                        <label htmlFor="courier" className="text-sm font-medium">
                            Courier <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="courier"
                            value={courierId || ""}
                            onChange={(e) => setCourierId(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">Select a courier</option>
                            {couriersData.map((courier) => (
                                <option key={courier.id} value={courier.id}>
                                    {courier.firstname} {courier.lastname}
                                </option>
                            ))}
                        </select>
                        {validationErrors?.courierId && (
                            <p className="text-red-400 text-sm">{validationErrors.courierId}</p>
                        )}
                    </div>

                    {/* Platform Select */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="platform" className="text-sm font-medium">
                            Platform <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value as "BOLT" | "WOLT" | "GLOVO")}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="BOLT">Bolt</option>
                            <option value="WOLT">Wolt</option>
                            <option value="GLOVO">Glovo</option>
                        </select>
                        {validationErrors?.platform && (
                            <p className="text-red-400 text-sm">{validationErrors.platform}</p>
                        )}
                    </div>

                    {/* Status Select */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="status" className="text-sm font-medium">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as "BLOCKED" | "ACTIVE" | "DELETED" | "UNKNOWN")
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DELETED">Deleted</option>
                            <option value="UNKNOWN">Unknown</option>
                        </select>
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