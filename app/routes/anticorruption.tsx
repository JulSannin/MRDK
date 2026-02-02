import type { Route } from './+types/anticorruption';

// Anticorruption page metadata
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Противодействие коррупции' }];
}

// Anticorruption page (under development)
export default function Anticorruption() {
    return (
        <>
            <p>Страница в разработке</p>
        </>
    );
}
