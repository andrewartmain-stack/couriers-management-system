import { useState, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

interface AddCityModalPropsInterface {
    onClose: () => void;
    addCity: (name: string) => void;
    validationErrors: Record<string, string> | null
}

export const AddCityModal: FC<AddCityModalPropsInterface> = ({ onClose, addCity, validationErrors }) => {

    const [nameInput, setNameInput] = useState<string>('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute h-screen inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Add City
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="name" className="text-sm -mb-1.25">City Name</label>
                    <Input nameValue="name" placeholderValue="Cluj-Napoca" inputValue={nameInput} onChangeAction={(e: any) => setNameInput(e.target.value)} required />
                    {validationErrors?.name && <p className="text-red-400 text-sm">{validationErrors.name}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        variant="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => addCity(nameInput.trim())}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};