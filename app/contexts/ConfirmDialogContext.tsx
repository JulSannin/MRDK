import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

// Confirm dialog provider component
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const lastActiveElementRef = useRef<HTMLElement | null>(null);

    const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);

        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(true);
        }
        setIsOpen(false);
        setOptions(null);
        setResolvePromise(null);
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(false);
        }
        setIsOpen(false);
        setOptions(null);
        setResolvePromise(null);
    }, [resolvePromise]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleCancel();
            }
        };

        if (isOpen) {
            lastActiveElementRef.current = document.activeElement as HTMLElement | null;
            document.addEventListener('keydown', handleEscape);
            requestAnimationFrame(() => {
                const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                firstFocusable?.focus();
            });
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, handleCancel]);

    useEffect(() => {
        if (!isOpen && lastActiveElementRef.current) {
            lastActiveElementRef.current.focus();
        }
    }, [isOpen]);

    const getVariantStyles = () => {
        switch (options?.variant || 'danger') {
            case 'danger':
                return {
                    button: 'bg-red-600 hover:bg-red-700 text-white',
                    icon: '⚠️',
                };
            case 'warning':
                return {
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    icon: '⚠',
                };
            case 'info':
                return {
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    icon: 'ℹ',
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            {isOpen && options && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-[200] animate-fade-in"
                        onClick={handleCancel}
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
                        <div
                            role={options.variant === 'danger' ? 'alertdialog' : 'dialog'}
                            aria-modal="true"
                            aria-labelledby="dialog-title"
                            aria-describedby="dialog-description"
                            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                            ref={dialogRef}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <span className="text-3xl" aria-hidden="true">{styles.icon}</span>
                                <div className="flex-1">
                                    <h3 id="dialog-title" className="text-xl font-bold text-gray-900 mb-2">
                                        {options.title || 'Подтверждение действия'}
                                    </h3>
                                    <p id="dialog-description" className="text-gray-700">{options.message}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={handleCancel}
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    {options.cancelText || 'Отмена'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    type="button"
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${styles.button}`}
                                >
                                    {options.confirmText || 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ConfirmDialogContext.Provider>
    );
}

// Confirm dialog hook
export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
    }
    return context;
}
