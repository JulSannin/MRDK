import { socialLinksData } from './footerSocialLinksData';

/** Компонент социальных сетей в подвале */
export default function FooterSocialMedia() {
    return (
        <div className="max-w-[144px]">
            <p className="text-[#D9D9D9] text-[16px] font-bold">
                Социальные сети
            </p>
            <hr className="bg-[#D9D9D9] h-[2px] mt-[10px]" />
            <div className="flex flex-row gap-[10px] mt-[10px] mb-[10px]">
                {socialLinksData.map((link) => {
                    return (
                        <a
                            key={link.href}
                            href={link.href}
                            target={link.target}
                            rel={link.rel}
                            aria-label={link.ariaLabel}
                            className="hover:opacity-75 transition-opacity"
                        >
                            <img
                                className="w-[26px] md:w-[30px] h-auto"
                                src={link.icon}
                                alt={link.label}
                            />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
