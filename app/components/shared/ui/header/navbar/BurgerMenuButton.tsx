/** Кнопка бургер-меню для мобильных устройств */
export default function BurgerMenuButton({
    isOpen,
    onToggle,
}: {
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            className="xl:hidden flex flex-col justify-center w-[20px] gap-[4px] ml-[10px] cursor-pointer"
            onClick={onToggle}
            aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
            <span
                className={`h-[2px] bg-black transition-all duration-300 ${
                    isOpen ? 'relative rotate-45 top-[5px]' : ''
                }`}
            />
            <span
                className={`h-[2px] bg-black transition-all duration-300 ${
                    isOpen ? 'opacity-0' : ''
                }`}
            />
            <span
                className={`h-[2px] bg-black transition-all duration-300 ${
                    isOpen ? 'relative -rotate-45 bottom-[7px]' : ''
                }`}
            />
        </button>
    );
}