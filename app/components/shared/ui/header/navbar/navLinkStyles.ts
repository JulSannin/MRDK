// Стили для навигационных ссылок
//
// getNavLinkClassName - стили для обычной навигации (десктоп)
// - Подчёркивание активной ссылки (shadow снизу)
// - Hover эффект с появлением подчёркивания
// - Плавные переходы (transition-shadow)
//
// getBurgerMenuNavLinkClassName - стили для бургер-меню (мобильные)
// - Активная ссылка выделяется тёмным фоном
// - Пунктирные разделители между пунктами
//
// Используется в NavLinks и BurgerMenuPanel

export const getNavLinkClassName = ({
    isActive,
}: {
    isActive: boolean;
}): string => {
    return [
        'text-[#31393C]',
        'focus:shadow-[0_2px_0_0_#F79824]',
        'hover:shadow-[0_2px_0_0_#F79824]',
        isActive ? 'shadow-[0_2px_0_0_#F79824]' : '',
        'transition-shadow duration-200',
    ].join(' ');
};

export const getBurgerMenuNavLinkClassName = ({
    isActive,
}: {
    isActive: boolean;
}): string => {
    return [
        `border-b border-dashed p-[4px_0_4px_0] pl-[10px] text-lg ${
            isActive
                ? 'bg-[#31393C] text-[#fdca40]'
                : 'text-[#31393C] font-medium'
        }`,
    ].join(' ');
};
