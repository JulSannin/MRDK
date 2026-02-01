import EventCard from './EventCard';
import type { Event } from '../../entities/types';

interface EventGridProps {
    events: Event[];
}

export default function EventGrid({ events }: EventGridProps) {
    return (
        <div className="flex flex-wrap justify-center lg:justify-start max-w-[300px] lg:max-w-[830px] xl:max-w-[1260px] gap-[30px] m-auto pb-[60px]">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    shortDescription={event.shortDescription}
                    date={event.date}
                    image={event.image || ''}
                />
            ))}
        </div>
    );
}
