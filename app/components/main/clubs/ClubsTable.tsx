import { ClubsData } from './clubsData';

// Clubs and circles table component
export default function ClubsTable() {
    return (
        <div className="overflow-x-auto mt-[20px] mb-[20px] m-auto max-w-[1260px] text-[16px]">
            <table className="w-full border-collapse">
                <caption className="sr-only">Список клубов и руководителей</caption>
                <thead>
                    <tr>
                        <th></th>
                        <th className="border p-4 text-left text-white font-bold app-bg-primary">Название клуба</th>
                        <th className="border p-4 text-left text-white font-bold app-bg-primary">Руководитель</th>
                    </tr>
                </thead>
                <tbody>
                    {ClubsData.map((club, index) => (
                        <tr 
                            key={club.id} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'app-bg-yellow-soft'} transition-colors app-hover-yellow`}
                        >
                            <td className="border border-[#D9D9D9] p-4 app-text-dark">{club.id}</td>
                            <td className="border border-[#D9D9D9] p-4 app-text-dark">{club.name}</td>
                            <td className="border border-[#D9D9D9] p-4 app-text-dark">{club.leader}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
