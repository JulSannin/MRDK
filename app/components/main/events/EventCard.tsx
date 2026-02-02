import { memo } from 'react';
import { NavLink } from 'react-router';
import { formatEventDate } from '../../../utils/dateHelpers';

interface EventCardProps {
    id: number;
    title: string;
    shortDescription: string;
    date: string;
    image: string;
}

/** Карточка события для сетки */
function EventCard({ id, title, shortDescription, date, image }: EventCardProps) {
    const linkPath = `/events/event/${id}`;
    const imageUrl = image && image.startsWith('http') ? image : (image ? `https://backend-production-190b.up.railway.app${image}` : '');

    return (
        <NavLink to={linkPath} viewTransition aria-label={title}>
            <article
                id={`event-${id}`}
                className="w-[300px] h-[300px]
      sm:w-[400px] sm:h-[400px]
      rounded-[10px] flex flex-col justify-between overflow-hidden relative transition-transform duration-300 ease-in-out hover:scale-105"
            >
                <div
                    className="absolute inset-0 bg-center bg-cover transition-transform duration-300 ease-in-out hover:scale-110"
                    style={{ 
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundColor: !imageUrl ? 'var(--color-dark)' : 'transparent'
                    }}
                />
                <time className="relative z-10 text-center w-[144px] ml-[10px] mt-[10px] text-white" style={{ backgroundColor: 'var(--color-dark-transparent)' }}>
                    {formatEventDate(date)}
                </time>
                <div className="relative z-10 h-[100px] rounded-b-[5px]" style={{ backgroundColor: 'rgba(33, 118, 255, 0.8)' }}>
                    <p className="m-[4px] font-semibold" style={{ color: 'var(--color-yellow)' }}>{title}</p>
                    <p className="m-[4px] text-[14px] text-white">{shortDescription}</p>
                </div>
            </article>
        </NavLink>
    );
}

export default memo(EventCard);
