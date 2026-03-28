import { type FC } from 'react'

interface InputPropsInterface {
    inputValue: string;
    nameValue: string;
    type?: "text" | "number" | "email" | "tel" | "date" | "password";
    required?: boolean;
    placeholderValue?: string;
    onChangeAction: (parametr?: any) => void;
    hasIcon?: boolean;
}

const Input: FC<InputPropsInterface> = ({ inputValue, nameValue, type = "text", required = false, placeholderValue, hasIcon = false, onChangeAction }) => {
    return (
        <input
            name={nameValue}
            className={`bg-gray-100 border border-transparent rounded-full py-3 px-4 ${hasIcon && "pl-10"} text-sm transition-all duration-300 ease-out focus:bg-white focus:border-gray-500 focus:outline-none min-w-72`}
            placeholder={placeholderValue}
            type={type}
            value={inputValue}
            onChange={onChangeAction}
            required={required}
        />
    )
}

export default Input