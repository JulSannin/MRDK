import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'warning' | 'secondary';
    loading?: boolean;
    children: ReactNode;
}

const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    secondary: 'bg-gray-400 hover:bg-gray-500 text-white',
};

/** Универсальный компонент кнопки */
export default function Button({
    variant = 'primary',
    loading = false,
    disabled,
    className = '',
    children,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={`
                px-4 py-2 rounded font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantStyles[variant]}
                ${className}
            `.trim()}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {children}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
