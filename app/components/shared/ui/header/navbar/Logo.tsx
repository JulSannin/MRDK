import { NavLink } from 'react-router';
import logoSvg from '../../../../../imgs/logo.svg';

/** Компонент логотипа сайта */
export default function Logo() {
    return (
        <NavLink
            to="/"
            className="group w-auto pl-[2px] xl:pt-[16px]"
            aria-label="Перейти на главную страницу"
        >
            <img
                src={logoSvg}
                alt="Логотип Мариинский районный дом культуры"
                className="w-[54px] xl:w-[82px] transition-transform duration-200 group-hover:scale-[1.1] group-focus-visible:scale-[1.1]"
            />
        </NavLink>
    );
}
