import { socialLinksData } from './navLinksData';

interface SocialMediaProps {
    className?: string;
}

/** Компонент ссылок на социальные сети */
export default function SocialMedia({ className = '' }: SocialMediaProps) {
    return (
        <div className={className}>
            {socialLinksData.map((link) => {
                return (
                    <a
                        key={link.href}
                        href={link.href}
                        target={link.target}
                        rel={link.rel}
                        aria-label={link.ariaLabel}
                        className="hover:scale-[1.1] transition-transform duration-200"
                    >
                        <img
                            className="w-[28px] xl:w-[34px]"
                            src={link.icon}
                            alt={link.label}
                        />
                    </a>
                );
            })}
        </div>
    );
}
