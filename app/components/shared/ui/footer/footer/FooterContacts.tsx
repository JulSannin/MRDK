import { NavLink } from 'react-router';
import { footerLinksData } from './footerLinksData';

/** Компонент контактной информации в подвале */
export default function FooterContacts() {
    const contactsLink = footerLinksData.find(
        (link) => link.path === '/contacts',
    );

    return (
        <div className="max-w-[224px]">
            
            <NavLink
                className="text-[16px] font-bold text-[#F79824] focus:underline hover:underline"
                to={contactsLink?.path || '/'}
                viewTransition
            >
                {contactsLink?.label}
            </NavLink>
            <hr className="bg-[#D9D9D9] h-[2px] mt-[10px] max-w-[78px]" />
            <p className="text-white text-[14px] font-medium mt-[10px] xl:text-[12px]">
                <span className="text-[#D9D9D9]">E-mail: </span>
                <a 
                    href="mailto:rdk-pristan@mail.ru" 
                    className="focus:underline hover:underline"
                    style={{ color: 'inherit' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-yellow)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    onFocus={(e) => e.currentTarget.style.color = 'var(--color-yellow)'}
                    onBlur={(e) => e.currentTarget.style.color = 'inherit'}
                >
                    rdk-pristan@mail.ru
                </a> <br />
                <span className="text-[#D9D9D9]">Адрес</span>: Кемеровская
                область, Мариинский район, д.2-Пристань, ул.Весенняя, 13 <br />
                <span className="text-[#D9D9D9]">Телефон</span>:
                <a 
                    href="tel:+89230318935" 
                    className="focus:underline hover:underline"
                    style={{ color: 'inherit' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-yellow)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    onFocus={(e) => e.currentTarget.style.color = 'var(--color-yellow)'}
                    onBlur={(e) => e.currentTarget.style.color = 'inherit'}
                >
                    +8-923-031-89-35
                </a> , 37-1-36
            </p>
        </div>
    );
}
