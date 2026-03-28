import type { FC, ReactNode } from "react"

interface ButtonPropsInterface {
    children: ReactNode;
    onClickAction: () => void;
    variant?: "dark" | "error" | "secondary" | "success",
    type?: "button" | "submit" | "reset" | undefined,
    disabled?: boolean
}

const Button: FC<ButtonPropsInterface> = ({ children, variant = "dark", type = "button", disabled = false, onClickAction }) => {

    let typeBasedStyles = {
        style: {},
        className: ""
    };

    switch (variant) {
        case "dark":
            typeBasedStyles.style = { background: "var(--accent-dark)" };
            typeBasedStyles.className = "text-white px-4 py-3 cursor-pointer"
            break;

        case "error":
            typeBasedStyles.style = { background: "var(--error-bg)" };
            typeBasedStyles.className = "text-[var(--error-text)] px-4 py-3 cursor-pointer"
            break;

        case "secondary":
            typeBasedStyles.style = { background: "var(--accent-dark)" };
            typeBasedStyles.className = "text-white rounded-lg border border-[var(--accent-dark)] px-2 py-2 text-xs cursor-pointer"
            break;
        case "success":
            typeBasedStyles.style = {};
            typeBasedStyles.className = `${disabled ? "bg-gray-300 text-gray-500 hover:opacity-100" : "bg-green-100 text-green-500 cursor-pointer"} px-4 py-3`
    }

    return (
        <button type={type} onClick={onClickAction} style={typeBasedStyles.style}
            className={`flex items-center gap-2 rounded-xl text-sm hover:opacity-75 transition ${typeBasedStyles.className}`} disabled={disabled}>
            {children}
        </button>
    )
}

export default Button