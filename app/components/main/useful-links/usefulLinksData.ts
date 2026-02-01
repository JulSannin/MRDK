import svoiImg from '../../../imgs/SVOi.jpg';
import oprosImg from '../../../imgs/opros.jpg';
import krfImg from '../../../imgs/krf.jpg';
import grantImg from '../../../imgs/banner-grant.png';

export interface UsefulLink {
    id: number;
    title: string;
    description: string;
    url: string;
    icon?: string;
    image?: string;
    objectFit?: 'cover' | 'contain';
    backgroundColor?: string;
}

/** Данные полезных ссылок */
export const usefulLinksData: UsefulLink[] = [
    {
        id: 1,
        title: 'СВОи',
        description: 'СВОи - поддержка участников специальной военной операции',
        url: 'https://nt-kuzbass.ru/afisha/detail.php?ID=991',
        image: svoiImg
    },
    {
        id: 2,
        title: 'Опрос',
        description: 'Внимание! Опрос - примите участие',
        url: 'https://forms.mkrf.ru/e/2579/xTPLeBU7/?ap_orgcode=550160326',
        image: oprosImg
    },
    {
        id: 3,
        title: 'Культура.РФ',
        description: 'Портал культурного наследия и традиций России',
        url: 'https://www.culture.ru/',
        image: krfImg,
        objectFit: 'contain',
        backgroundColor: '#38393d'
    },
    {
        id: 4,
        title: 'Культура.Гранты России',
        description: 'Портал грантовой поддержки в сфере культуры',
        url: 'https://grants.culture.ru/',
        image: grantImg,
        objectFit: 'contain',
        backgroundColor: '#f3f3f3'
    }
];
