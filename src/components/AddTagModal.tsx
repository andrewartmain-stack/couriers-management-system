import { useState, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

interface AddTagModalPropsInterface {
    onClose: () => void;
    addTag: (name: string, description: string) => void;
    validationErrors: Record<string, string> | null
}

export const AddTagModal: FC<AddTagModalPropsInterface> = ({ onClose, addTag, validationErrors }) => {

    const [nameInput, setNameInput] = useState<string>('');
    const [descriptionInput, setDescriptionInput] = useState<string>('');

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
                    Add Tag
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="name" className="text-sm -mb-1.25">Tag Name</label>
                    <Input nameValue="name" placeholderValue="multi-account" inputValue={nameInput} onChangeAction={(e: any) => setNameInput(e.target.value)} required />
                    {validationErrors?.name && <p className="text-red-400 text-sm">{validationErrors.name}</p>}

                    <label htmlFor="description" className="text-sm -mb-1.25">Description (Optional)</label>
                    <textarea
                        name="description"
                        placeholder="Enter tag description..."
                        value={descriptionInput}
                        onChange={(e) => setDescriptionInput(e.target.value)}
                        rows={3}
                        className="bg-gray-100 border border-transparent rounded-2xl py-3 px-4 text-sm transition-all duration-300 ease-out focus:bg-white focus:border-black focus:outline-none resize-none"
                    />
                    {validationErrors?.description && <p className="text-red-400 text-sm">{validationErrors.description}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        variant="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => addTag(nameInput.trim(), descriptionInput.trim())}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};