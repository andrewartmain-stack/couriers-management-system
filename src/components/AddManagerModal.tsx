import { useState, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

interface AddManagerModalPropsInterface {
    onClose: () => void;
    addManager: (firstName: string, lastName: string, email: string, phoneNumber: string, prefix: string) => void;
    validationErrors: Record<string, string> | null;
}

export const AddManagerModal: FC<AddManagerModalPropsInterface> = ({ onClose, addManager, validationErrors }) => {

    const [firstNameInput, setFirstNameInput] = useState<string>('');
    const [lastNameInput, setLastNameInput] = useState<string>('');
    const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
    const [emailInput, setEmailInput] = useState<string>('');
    const [prefixInput, setPrefixInput] = useState<string>('')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute h-screen inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 h-[600px] overflow-y-scroll">
                <h2 className="text-lg font-semibold mb-4">
                    Add Manager
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="firstname" className="text-sm -mb-1.25">First Name</label>
                    <Input nameValue="firstname" placeholderValue="Mohammed" inputValue={firstNameInput} onChangeAction={(e: any) => setFirstNameInput(e.target.value)} required />
                    {validationErrors?.firstname && <p className="text-red-400 text-sm">{validationErrors.firstname}</p>}
                    <label htmlFor="lastname" className="text-sm -mb-1.25">Last Name</label>
                    <Input nameValue="lastname" placeholderValue="Abdul" inputValue={lastNameInput} onChangeAction={(e: any) => setLastNameInput(e.target.value)} required />
                    {validationErrors?.lastname && <p className="text-red-400 text-sm">{validationErrors.lastname}</p>}
                    <label htmlFor="email" className="text-sm -mb-1.25">Email</label>
                    <Input nameValue="email" placeholderValue="example@gmail.com" inputValue={emailInput} onChangeAction={(e: any) => setEmailInput(e.target.value.trim())} type="email" required />
                    {validationErrors?.email && <p className="text-red-400 text-sm">{validationErrors.email}</p>}
                    <label htmlFor="phone" className="text-sm -mb-1.25">Phone</label>
                    <Input nameValue="phone" placeholderValue="+40740784350" inputValue={phoneNumberInput} onChangeAction={(e: any) => setPhoneNumberInput(e.target.value)} type="tel" required />
                    {validationErrors?.phoneNumber && <p className="text-red-400 text-sm">{validationErrors.phoneNumber}</p>}
                    <label htmlFor="prefix" className="text-sm -mb-1.25">Prefix</label>
                    <Input nameValue="prefix" placeholderValue="MA" inputValue={prefixInput} onChangeAction={(e: any) => setPrefixInput(e.target.value)} required />
                    {validationErrors?.prefix && <p className="text-red-400 text-sm">{validationErrors.prefix}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        variant="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => addManager(firstNameInput.trim(), lastNameInput.trim(), phoneNumberInput.trim(), emailInput.trim(), prefixInput.trim())}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};