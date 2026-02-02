import { navLinksData } from './navLinksData';
import { getBurgerMenuNavLinkClassName } from './navLinkStyles';
import SocialMedia from './SocialMedia';
import NavLinkItem from './NavLinkItem';

/** Панель бургер-меню для мобильных устройств */
export default function BurgerMenuPanel({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed z-10 inset-0 xl:hidden"
                    onClick={onClose}
                />
            )}

            <nav
                className={`fixed z-20 w-full top-[56px] 
          flex flex-col xl:hidden transition-all duration-600 transform ${
              isOpen
                  ? 'translate-y-0 opacity-100 visible'
                  : '-translate-y-full opacity-0 invisible'
          }`}
                style={{ backgroundColor: 'var(--color-yellow)' }}
            >
                <hr className="border-dashed" />
                {navLinksData.map((link) => (
                    <NavLinkItem
                        key={link.type === 'internal' ? link.path : link.href}
                        link={link}
                        internalClassName={getBurgerMenuNavLinkClassName}
                        externalClassName="border-b border-dashed p-[4px_0_4px_0] pl-[10px] text-lg"
                        onClick={onClose}
                    />
                ))}
                <SocialMedia
                    className={
                        'h-[56px] flex md:hidden items-center ml-[10px] gap-[10px]'
                    }
                />
            </nav>
        </>
    );
}
