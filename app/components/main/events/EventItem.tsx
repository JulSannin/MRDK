import { useNavigate } from 'react-router';
import type { Event } from '../../entities/types';
import { formatEventDate } from '../../../utils/dateHelpers';
import { API_URL } from '../../../config/constants';

/** Полная страница отдельного события */
export default function EventItem({ event }: { event: Event }) {
    const navigate = useNavigate();
    const imageUrl = event.image && event.image.startsWith('http') ? event.image : (event.image ? `${API_URL}${event.image}` : '');

    if (!event) return <p>Событие не найдено</p>;

    return (
        <div className="max-w-4xl mx-auto m-[40px]">
            <button
                onClick={() => navigate(-1)}
                    className="mb-4 px-4 py-2 bg-red-500 text-white hover:bg-red-700 rounded font-semibold transition-colors mx-[10px]"
            >
                ← Назад
            </button>
            {imageUrl && (
                    <img src={imageUrl} alt={event.title} className="w-full max-w-[900px] px-[10px]" />
            )}
                <p className="text-gray-600 mt-4 px-[10px]">{formatEventDate(event.date)}</p>
                <h1 className="text-3xl font-bold mt-2 mb-4 px-[10px]">{event.title}</h1>
                <p className="text-lg whitespace-pre-wrap px-[10px]">{event.fullDescription}</p>
        </div>
    );
}
