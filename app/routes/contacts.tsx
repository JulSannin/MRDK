import type { Route } from './+types/contacts';

/**
 * Мета-данные для страницы контактов
 * @returns {Array} Массив мета-тегов
 */
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Контакты' }];
}

/**
 * Страница контактов
 * @returns {JSX.Element} React-компонент
 */
export default function Contacts() {
    return (
        <>
            <p>Страница в разработке</p>
        </>
    );
}
