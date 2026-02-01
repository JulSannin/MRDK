// Данные ссылок для футера
//
// footerLinksData - список всех внутренних страниц для навигации в подвале
// Аналогично navLinksData, но без внешних ссылок
//
// Используется в FooterLinks

import type { FooterLinkItem } from '../../../types/links';

export const footerLinksData: FooterLinkItem[] = [
    { type: 'internal', path: '/', label: 'Главная' },
    { type: 'internal', path: '/events', label: 'События' },
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
