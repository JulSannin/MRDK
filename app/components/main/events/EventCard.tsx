import { memo } from 'react';
import { NavLink } from 'react-router';
import { formatEventDate } from '../../../utils/dateHelpers';
import { normalizeImageUrl } from '../../../utils/fileHelpers';

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
    const imageUrl = normalizeImageUrl(image);

    return (
        <NavLink to={linkPath} viewTransition aria-label={title}>
            <article
                id={`event-${id}`}
                className="w-[300px] h-[300px]
      sm:w-[400px] sm:h-[400px]
      rounded-[10px] flex flex-col justify-between overflow-hidden relative transition-transform duration-300 ease-in-out hover:scale-105"
            >
                <div
                    className={`absolute inset-0 bg-center bg-cover transition-transform duration-300 ease-in-out hover:scale-110 ${
                        imageUrl ? '' : 'app-bg-dark'
                    }`}
                    style={{ 
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none'
                    }}
                />
                <time className="relative z-10 text-center w-[144px] ml-[10px] mt-[10px] text-white app-bg-dark-transparent">
                    {formatEventDate(date)}
                </time>
                <div className="relative z-10 h-[100px] rounded-b-[5px] app-bg-primary-80">
                    <p className="m-[4px] font-semibold app-text-yellow">{title}</p>
                    <p className="m-[4px] text-[14px] text-white">{shortDescription}</p>
                </div>
            </article>
        </NavLink>
    );
}

export default memo(EventCard);
