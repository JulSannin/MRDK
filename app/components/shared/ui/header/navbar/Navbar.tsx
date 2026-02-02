import Logo from './Logo';
import NavLinks from './NavLinks';
import NavActions from './NavActions';
import { useState, useEffect, useRef, useCallback } from 'react';
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
    const requestIdRef = useRef(0);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const shouldCheck = !hasCheckedTokenRef.current || location.pathname.startsWith('/admin') || location.pathname === '/';
        
        if (shouldCheck && !isCheckingRef.current) {
            isCheckingRef.current = true;
            const requestId = ++requestIdRef.current;
            
            api.verifyToken(controller.signal)
                .then((result) => {
                    if (isMounted && requestIdRef.current === requestId) {
                        setHasAdminToken(result.valid);
                        hasCheckedTokenRef.current = true;
                    }
                })
                .catch((err) => {
                    if (err instanceof DOMException && err.name === 'AbortError') {
                        return;
                    }
                    if (isMounted && requestIdRef.current === requestId) {
                        setHasAdminToken(false);
                        hasCheckedTokenRef.current = true;
                    }
                })
                .finally(() => {
                    if (isMounted && requestIdRef.current === requestId) {
                        isCheckingRef.current = false;
                    }
                });
        }
        
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [location.pathname]);

    const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
    const closeMenu = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <div className="flex justify-between w-full h-[56px] relative z-50 app-bg-yellow">
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
