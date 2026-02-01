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
                        <th className="bg-[#2176FF] border p-4 text-left text-white font-bold">Название клуба</th>
                        <th className="bg-[#2176FF] border p-4 text-left text-white font-bold">Руководитель</th>
                    </tr>
                </thead>
                <tbody>
                    {ClubsData.map((club, index) => (
                        <tr 
                            key={club.id} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#fdca40]/10'} hover:bg-[#fdca40]/20 transition-colors`}
                        >
                            <td className="border border-[#D9D9D9] p-4 text-[#31393C]">{club.id}</td>
                            <td className="border border-[#D9D9D9] p-4 text-[#31393C]">{club.name}</td>
                            <td className="border border-[#D9D9D9] p-4 text-[#31393C]">{club.leader}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
