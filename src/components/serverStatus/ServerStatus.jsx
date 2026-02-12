import { Cpu, MemoryStick, HardDrive, BarChart3, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const servers = [
  {
    name: 'Servidor Web Principal',
    cpu: 32,
    ram: 58,
    disk: 42,
  },
  {
    name: 'Banco de Dados',
    cpu: 15,
    ram: 40,
    disk: 65,
  },
  {
    name: 'Servidor de E-mail',
    cpu: 72,
    ram: 68,
    disk: 55,
  },
];

const ServerStatus = () => {
  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 p-5 rounded-xl shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">Eventos Aprovados</h2>
        <div className="flex items-center gap-3">
            <Link
              to="/ApproveTransport"
              className="text-blue-600 text-sm hover:underline dark:text-blue-400"
            >
              Ver todos
            </Link>
            <RefreshCw size={20} className="cursor-pointer text-blue-500 hover:text-blue-700" onClick={() => window.location.reload()} />
          </div>
      </div>
      <div className="space-y-4">
        {servers.map((server, index) => (
          <div key={index} className="bg-blue-100 p-4 rounded-lg flex justify-between items-start dark:bg-gray-900">
            <div>
              <div className="flex items-center gap-2 font-semibold dark:text-gray-400 mb-1">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                {server.name}
              </div>
              <div className="flex text-sm text-gray-500 gap-4">
                <div className="flex items-center gap-1"><Cpu className="w-4 h-4 dark:text-gray-200" /> CPU: {server.cpu}%</div>
                <div className="flex items-center gap-1"><MemoryStick className="w-4 h-4" /> RAM: {server.ram}%</div>
                <div className="flex items-center gap-1"><HardDrive className="w-4 h-4" /> Disco: {server.disk}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600" />
              <Settings className="text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerStatus;
