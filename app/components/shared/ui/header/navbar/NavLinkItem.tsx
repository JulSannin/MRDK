import { NavLink } from 'react-router';
import type { NavLinkItem } from '../../../types/links';

interface NavLinkItemProps {
    link: NavLinkItem;
    internalClassName?: (args: { isActive: boolean }) => string;
    externalClassName?: string;
    onClick?: () => void;
}

export default function NavLinkItem({
    link,
    internalClassName,
    externalClassName,
    onClick,
}: NavLinkItemProps) {
    if (link.type === 'internal') {
        return (
            <NavLink
                to={link.path}
                viewTransition
                className={internalClassName}
                onClick={onClick}
            >
                {link.label}
            </NavLink>
        );
    }

    return (
        <a
            href={link.href}
            target={link.target}
            rel={link.rel}
            className={externalClassName}
            onClick={onClick}
        >
            {link.label}
        </a>
    );
}
