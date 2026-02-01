// Данные социальных ссылок для футера

import type { SocialLink } from '../../../types/links';
import vkLogoSvg from '../../../../../imgs/vkLogo.svg';
import okLogoSvg from '../../../../../imgs/okLogo.svg';

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
