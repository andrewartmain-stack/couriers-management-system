import { FC } from 'react'
import { MdArrowDropDown } from 'react-icons/md'

interface SelectOption {
    value: string | number
    label: string
}

interface SelectProps {
    value: string | number
    onChange: (value: string | number) => void
    options: SelectOption[]
    label?: string
    placeholder?: string
    className?: string
}

const Select: FC<SelectProps> = ({ value, onChange, options, label, placeholder, className = '' }) => {
    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder || 'Select...'

    return (
        <div className={`relative inline-block w-full ${className}`}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value === '' ? '' : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)))}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-700 text-sm font-medium transition-all duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <MdArrowDropDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
        </div>
    )
}

export default Select
