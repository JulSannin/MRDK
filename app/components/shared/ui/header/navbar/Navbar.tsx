import Logo from './Logo';
import NavLinks from './NavLinks';
import NavActions from './NavActions';
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { getNavLinkClassName } from './navLinkStyles';
import BurgerMenuButton from './BurgerMenuButton';
import BurgerMenuPanel from './BurgerMenuPanel';
import { api } from '../../../../../utils/api';

/** Навигационная панель сайта */
export default function NavBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasAdminToken, setHasAdminToken] = useState(false);
    const location = useLocation();
    const hasCheckedTokenRef = useRef(false);
    const isCheckingRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        const shouldCheck = !hasCheckedTokenRef.current || location.pathname.startsWith('/admin');
        
        if (shouldCheck && !isCheckingRef.current) {
            isCheckingRef.current = true;
            
            api.verifyToken()
                .then((result) => {
                    if (isMounted) {
                        setHasAdminToken(result.valid);
                        hasCheckedTokenRef.current = true;
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        setHasAdminToken(false);
                        hasCheckedTokenRef.current = true;
                    }
                })
                .finally(() => {
                    if (isMounted) {
                        isCheckingRef.current = false;
                    }
                });
        }
        
        return () => {
            isMounted = false;
        };
    }, [location.pathname]);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <>
            <div className="flex justify-between bg-[#fdca40] w-full h-[56px] relative z-50">
                <BurgerMenuButton isOpen={isOpen} onToggle={toggleMenu} />
                <div className="flex items-center gap-[10px]">
                    <Logo />
                    {hasAdminToken && (
                        <NavLink to="/admin" viewTransition className={getNavLinkClassName}>
                            Админ
                        </NavLink>
                    )}
                </div>
                <NavLinks />
                <NavActions />
            </div>
            <BurgerMenuPanel isOpen={isOpen} onClose={closeMenu} />
        </>
    );
}
