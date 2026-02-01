import type { Route } from './+types/clubs';
import ClubsTable from '../components/main/clubs/ClubsTable';

/**
 * Мета-данные для страницы клубов
 * @returns {Array} Массив мета-тегов
 */
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Клубы' }];
}

/**
 * Страница со списком клубов
 * @returns {JSX.Element} React-компонент
 */
export default function Clubs() {
    return (
        <>
            <ClubsTable />
        </>
    );
}
