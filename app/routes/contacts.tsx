import type { Route } from './+types/contacts';

// Contacts page metadata
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Контакты' }];
}

// Contacts page (under development)
export default function Contacts() {
    return (
        <>
            <p>Страница в разработке</p>
        </>
    );
}
