import { useState, type FC } from "react";

import Button from "./Button";
import Input from "./Input";

interface StartNewReportModalPropsInterface {
    onClose: () => void;
    startNewReport: (startedAt: string, endedAt: string) => void;
    validationErrors: Record<string, string> | null
}

export const StartNewReportModal: FC<StartNewReportModalPropsInterface> = ({ onClose, startNewReport, validationErrors }) => {

    const [startedAt, setStartedAt] = useState<string>("");
    const [endedAt, setEndedAt] = useState<string>("");

    const addSixDays = (dateString: string) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 6);

        return date.toISOString().split("T")[0];
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        setStartedAt(value);
        setEndedAt(addSixDays(value));
    };

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
                    Start New Report
                </h2>

                <div className="flex flex-col gap-3">
                    <label htmlFor="startedAt" className="text-sm -mb-1.25">Started At</label>
                    <Input type="date" nameValue="startedAt" placeholderValue="" inputValue={startedAt} onChangeAction={(e: any) => {
                        setStartedAt(e.target.value);
                        handleStartDateChange(e);
                    }} required />
                    {validationErrors?.startedAt && <p className="text-red-400 text-sm">{validationErrors.startedAt}</p>}
                    <label htmlFor="endedAt" className="text-sm -mb-1.25">Ended At (automatically adjusted)</label>
                    <Input type="date" nameValue="endedAt" placeholderValue="" inputValue={endedAt} onChangeAction={(e: any) => setEndedAt(e.target.value)} required />
                    {validationErrors?.endedAt && <p className="text-red-400 text-sm">{validationErrors.endedAt}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClickAction={onClose}
                        type="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClickAction={() => startNewReport(startedAt, endedAt)}
                    >
                        Start
                    </Button>
                </div>
            </div>
        </div>
    );
};