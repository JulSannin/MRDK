import { ClubsData } from './clubsData';

/** Таблица с информацией о клубах и кружках */
export default function ClubsTable() {
    return (
        <div className="overflow-x-auto mt-[20px] mb-[20px] m-auto max-w-[1260px] text-[16px]">
            <table className="w-full border-collapse">
                <caption className="sr-only">Список клубов и руководителей</caption>
                <thead>
                    <tr>
                        <th></th>
                        <th className="border p-4 text-left text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>Название клуба</th>
                        <th className="border p-4 text-left text-white font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>Руководитель</th>
                    </tr>
                </thead>
                <tbody>
                    {ClubsData.map((club, index) => (
                        <tr 
                            key={club.id} 
                            className={`${index % 2 === 0 ? 'bg-white' : ''} transition-colors`}
                            style={index % 2 !== 0 ? { backgroundColor: 'rgba(253, 202, 64, 0.1)' } : undefined}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(253, 202, 64, 0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : 'rgba(253, 202, 64, 0.1)'; }}
                        >
                            <td className="border border-[#D9D9D9] p-4" style={{ color: 'var(--color-dark)' }}>{club.id}</td>
                            <td className="border border-[#D9D9D9] p-4" style={{ color: 'var(--color-dark)' }}>{club.name}</td>
                            <td className="border border-[#D9D9D9] p-4" style={{ color: 'var(--color-dark)' }}>{club.leader}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
