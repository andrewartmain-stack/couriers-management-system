import { type FC } from "react";

import Button from "./Button";

interface DeletionPropsInterface {
    message: string;
    onClose: () => void;
    onDelete: () => void;
}

export const DeletionModal: FC<DeletionPropsInterface> = ({ message, onClose, onDelete }) => {

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
                    {message}
                </h2>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        type="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => onDelete()}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};