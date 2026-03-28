import type { FC, ReactNode } from "react"

interface CardPropsInterface {
    children: ReactNode;
    type: "dark" | "light";
    className?: string;
    onClickAction?: () => void;
}

const Card: FC<CardPropsInterface> = ({ children, type, className, onClickAction }) => {

    switch (type) {
        case "dark":
            return (
                <div onClick={onClickAction} className={`relative h-56 rounded-xl overflow-hidden shadow-lg p-6 text-white hover:scale-[101%] transition-all ${className}`}
                    style={{ background: 'linear-gradient(to right, var(--card-gradient-start), var(--card-gradient-end))' }}>

                    {/* Волна */}
                    <svg
                        className="absolute bottom-0 left-0 w-full h-24"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="var(--card-wave-color)"
                            d="M0,160 C360,200 1080,120 1440,160 L1440,320 L0,320 Z"
                        />
                    </svg>

                    {/* Контент */}
                    <div className="relative z-10 flex flex-col justify-between gap-1 h-full">
                        {children}
                    </div>
                </div>
            )
        case "light":
            return (
                <div onClick={onClickAction} className={`relative rounded-xl min-h-56 overflow-hidden p-6 border border-[var(--border-default)] hover:scale-[101%] transition-all ${className}`}
                    style={{ background: 'linear-gradient(to right, var(--card2-gradient-start), var(--card2-gradient-end))' }}>

                    {/* Волна */}
                    <svg
                        className="absolute bottom-0 left-0 w-full h-24"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="var(--card2-wave-color)"
                            d="M0,360 C350,200 1080,120 1440,160 L1440,320 L0,320 Z"
                        />
                    </svg>

                    {/* Контент */}
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        {children}
                    </div>
                </div>
            )
    }
}

export default Card