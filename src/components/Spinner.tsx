import type { FC } from "react";

interface SpinnerPropsInterface {
    size?: number
}

const Spinner: FC<SpinnerPropsInterface> = ({ size = 8 }) => {
    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className={`h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-white`} />
        </div>
    );
};

export default Spinner;