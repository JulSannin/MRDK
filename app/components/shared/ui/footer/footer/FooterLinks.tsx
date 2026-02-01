import { memo } from 'react';
import { NavLink } from 'react-router';
import { footerLinksData } from './footerLinksData';
import logoSvg from '../../../../../imgs/logo.svg';

/** Компонент навигационных ссылок в подвале */
function FooterLinks() {
    return (
        <div className="max-w-[818px]">
            <p className="md:text-[#D9D9D9] md:text-[16px] md:font-bold hidden md:block xl:hidden">
                Навигация
            </p>
            <hr className="bg-[#D9D9D9] h-[2px] mt-[10px] hidden md:block xl:hidden" />
            <div
                className="hidden text-white mt-[10px] xl:mt-[0]
            md:flex md:flex-col md:gap-[4px] md:text-[12px] md:font-medium
            xl:flex xl:flex-row xl:gap-[20px] xl:text-[16px] xl:font-bold"
            >
                {footerLinksData.map((link) => {
                    if (link.path === '/contacts')
                        return null;
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            viewTransition
                            className="text-[#F79824] focus:underline hover:underline"
                        >
                            {link.label}
                        </NavLink>
                    );
                })}
            </div>
            <hr className="bg-[#D9D9D9] h-[2px] mt-[10px] hidden xl:block" />
            <img
                src={logoSvg}
                alt="Логотип Мариинский районный дом культуры"
                className="mt-[10px] mb-[10px] w-[68px] xl:w-[82px] xl:mt-[20px] xl:mb-[20px]"
            />
        </div>
    );
}

export default memo(FooterLinks);
