import type { Route } from './+types/clubs';
import ClubsTable from '../components/main/clubs/ClubsTable';

// Clubs page metadata
export function meta({}: Route.MetaArgs) {
    return [{ title: 'Клубы' }];
}

// Clubs page
export default function Clubs() {
    return (
        <>
            <ClubsTable />
        </>
    );
}
