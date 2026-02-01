// Типы для ссылок
// Внутренняя
export type InternalLink = {
    type: 'internal';
    path: string;
    label: string;
};

// Внешняя
export type ExternalLink = {
    type: 'external';
    href: string;
    label: string;
    target: '_blank';
    rel: 'noopener noreferrer';
};

// Ссылка-изображение на соцсеть
export type SocialLink = {
    href: string;
    icon: string;
    label: string;
    ariaLabel: string;
    target: '_blank';
    rel: 'noopener noreferrer';
};

export type NavLinkItem = InternalLink | ExternalLink;
export type FooterLinkItem = InternalLink;
