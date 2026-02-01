import { memo } from 'react';
import { navLinksData } from './navLinksData';
import { getNavLinkClassName } from './navLinkStyles';
import NavLinkItem from './NavLinkItem';

/** Компонент списка навигационных ссылок */
function NavLinks() {
    return (
        <nav className="items-center gap-[20px] font-medium hidden xl:flex">
            {navLinksData.map((link) => (
                <NavLinkItem
                    key={link.type === 'internal' ? link.path : link.href}
                    link={link}
                    internalClassName={getNavLinkClassName}
                />
            ))}
        </nav>
    );
}

export default memo(NavLinks);
