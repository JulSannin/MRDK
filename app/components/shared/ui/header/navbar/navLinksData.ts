// Данные навигационных ссылок и социальных сетей
//
// navLinksData - список основных разделов сайта:
// - Внутренние ссылки (type: 'internal') - используют React Router
// - Внешние ссылки (type: 'external') - открываются в новой вкладке
//
// socialLinksData - ссылки на социальные сети:
// - VK (ВКонтакте)
// - OK (Одноклассники)
//
// Используется в NavLinks, BurgerMenuPanel, SocialMedia

import type { NavLinkItem, SocialLink } from '../../../types/links';
import vkLogoSvg from '../../../../../imgs/vkLogo.svg';
import okLogoSvg from '../../../../../imgs/okLogo.svg';

// Данные ссылок навигации
export const navLinksData: NavLinkItem[] = [
    { type: 'internal', path: '/', label: 'Главная' },
    { type: 'internal', path: '/events', label: 'События' },
    {
        type: 'external',
        href: 'https://www.culture.ru/afisha/kemerovskaya-oblast-kuzbass/institute-57961-mariinskii-raionnyi-dom-kultury',
        label: 'Афиша',
        target: '_blank',
        rel: 'noopener noreferrer',
    },
    { type: 'internal', path: '/clubs', label: 'Клубы' },
    {
        type: 'internal',
        path: '/workplan',
        label: 'План работы',
    },
    {
        type: 'internal',
        path: '/documents',
        label: 'Документы',
    },
    { type: 'internal', path: '/reminders', label: 'Памятки' },
    {
        type: 'internal',
        path: '/anticorruption',
        label: 'Противодействие коррупции',
    },
    {
        type: 'internal',
        path: '/contacts',
        label: 'Контакты',
    },
];

// Данные ссылок соцсетей
export const socialLinksData: SocialLink[] = [
    {
        href: 'https://vk.com/id532490310',
        icon: vkLogoSvg,
        label: 'Вконтакте',
        ariaLabel: 'Перейти на страницу Вконтакте',
        target: '_blank',
        rel: 'noopener noreferrer',
    },
    {
        href: 'https://ok.ru/profile/581571112868',
        icon: okLogoSvg,
        label: 'Одноклассники',
        ariaLabel: 'Перейти на страницу Одноклассники',
        target: '_blank',
        rel: 'noopener noreferrer',
    },
];
