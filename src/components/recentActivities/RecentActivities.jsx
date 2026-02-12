import {
  ArrowRightCircle,
  XCircle,
  Ticket,
  RefreshCw,
} from 'lucide-react';

const cars = [
    {
      avatar: "https://i.pravatar.cc/150?u=vm",
      name: "Victor Matheus",
      setor: "DOB - Diretoria de Obras",
      destiny: "Barreiros/Cabo de Santo Agostinho",
      endDate: "Fiat - Toro | RZL 0I59",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=rv",
      name: "Leonardo Jose",
      destiny: "Bezerros",
      endDate: "Fiat - Toro | RZO 4B37",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=zf",
      name: "Ellen Araújo",
      destiny: "Bode",
      endDate: "Fiat - Toro | RZN 1B18",
      statusColor: "bg-orange-100 text-orange-600",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=nx",
      name: "Ane Maria",
      destiny: "Caruaru",
      endDate: "Fiat - Toro | SOT 1B00",
      statusColor: "bg-orange-100 text-orange-600",
    },
  ];

const RecentActivities = () => {
  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 p-5 rounded-xl shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">Eventos Parcialmente Aprovados</h2>
        <a href="#" className="text-blue-600 text-sm hover:underline dark:text-blue-400">Ver todos</a>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400
                            dark:bg-gray-800
            ">
              <tr>
                <th className="py-3 px-4 dark:text-blue-50">Destino</th>
                <th className="py-3 px-4 dark:text-blue-50">Veículo de Ida</th>
                <th className="py-3 px-4 dark:text-blue-50">Veículo de Volta</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car, idx) => (
                <tr key={idx} className="border-tt">
                  <td className="text-sm py-4 px-4 dark:text-blue-200 whitespace-normal break-words">{car.destiny}</td>
                  <td className="text-sm py-4 px-4 dark:text-blue-200">{car.endDate}</td>
                  <td className="text-sm py-4 px-4 dark:text-blue-200">
                    <div className="flex items-center justify-left gap-3">
                      <ArrowRightCircle size={20} className="text-green-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out" onClick={() => alert('Atribuir')}/>
                      {/* <Ticket size={20} className="text-gray-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out" onClick={() => alert('Voucher')}/> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default RecentActivities;
