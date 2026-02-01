import type { UsefulLink } from './usefulLinksData';

interface UsefulLinkCardProps {
    link: UsefulLink;
}

/** Карточка полезной ссылки */
export default function UsefulLinkCard({ link }: UsefulLinkCardProps) {
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Перейти на ${link.title}`}
            className="block rounded-lg border border-gray-300 transition-all duration-300 overflow-hidden h-[200px] group"
        >
            <div 
                className="relative h-full overflow-hidden"
                style={{ backgroundColor: link.backgroundColor }}
            >
                <img
                    src={link.image}
                    alt={link.title}
                    className={`w-full h-full ${link.objectFit === 'contain' ? 'object-contain' : 'object-cover'} group-hover:scale-110 transition-transform duration-300`}
                    loading="lazy"
                />
            </div>
        </a>
    );
}
