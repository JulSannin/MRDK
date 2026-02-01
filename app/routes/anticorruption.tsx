import type { Route } from './+types/anticorruption';

/**
 * Мета-данные для страницы противодействия коррупции
 * @returns {Array} Массив мета-тегов
 */
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Противодействие коррупции' }];
}

/**
 * Страница противодействия коррупции
 * @returns {JSX.Element} React-компонент
 */
export default function Anticorruption() {
    return (
        <>
            <p>Страница в разработке</p>
        </>
    );
}
