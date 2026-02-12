import {
  ArrowRightCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import AssignModal from './AssignModal';

const TableView = ({ events = [], showViewAll = true, onSelectEvent }) => {
  const [openAssign, setOpenAssign] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);

  const handleAssignClick = (event) => {
    setCurrentPreset({
      solicitante: event.user_id,
      setorOrigem: event.destiny?.name || "Não informado",
      destino: event.destiny?.destiny_type || "Não definido",
      status: event.status_event,
    });
    setOpenAssign(true);
  };

  const handleAssignSubmit = (form) => {
    console.log('atribuir', form);
    setOpenAssign(false);
    setCurrentPreset(null);
  };

  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">
          Eventos Pendentes
        </h2>
        <div className="flex items-center gap-3">
          {showViewAll && (
            <Link
              to="/ApproveTransport"
              className="text-blue-600 text-sm hover:underline dark:text-blue-400"
            >
              Ver todos
            </Link>
          )}
          <RefreshCw
            size={20}
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400 dark:bg-gray-800">
            <tr>
              <th className="py-3 px-4 dark:text-blue-50">Código</th>
              <th className="py-3 px-4 dark:text-blue-50">Usuário</th>
              <th className="py-3 px-4 dark:text-blue-50">Destino</th>
              <th className="py-3 px-4 dark:text-blue-50">Início</th>
              <th className="py-3 px-4 dark:text-blue-50">Fim</th>
              <th className="py-3 px-4 dark:text-blue-50">Status</th>
              <th className="py-3 px-4 dark:text-blue-50">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-gray-200 dark:border-gray-600">
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  {event.code}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  {event.user_id}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  {event.destiny?.name || "Não definido"}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  {event.date_start}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  {event.date_end}
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-200 dark:bg-gray-700">
                    {event.status_event}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                  <div className="flex items-center gap-3">
                    <ArrowRightCircle
                      size={20}
                      className="text-green-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out"
                      onClick={() => handleAssignClick(event)}
                    />
                    <XCircle
                      size={20}
                      className="text-red-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out"
                      onClick={() => alert('Negar')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignModal
        isOpen={openAssign}
        onClose={() => setOpenAssign(false)}
        onSubmit={handleAssignSubmit}
        preset={currentPreset || {}}
      />
    </div>
  );
};

export default TableView;