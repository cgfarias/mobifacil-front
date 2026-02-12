import { useEffect, useState } from 'react';
import { ArrowRightCircle, XCircle, RefreshCw, X } from 'lucide-react';
import ApproveTransportModal from './ApproveTransportModal';
import api from '../../api/axios';

const ApproveTransportTableView = ({ showViewAll = true }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal de negação
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyEventId, setDenyEventId] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);

  // Recuperar user_id
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) return;
    try {
      const userData = JSON.parse(authData);
      if (userData?.user_id) setUserId(parseInt(userData.user_id, 10));
    } catch (err) {
      console.error('Erro ao ler authData:', err);
    }
  }, []);

  const statusConfig = {
    pending: { label: "Pendente", bg: "bg-yellow-400", text: "text-yellow-100" },
    "pre approved": { label: "Pré-aprovado", bg: "bg-blue-400", text: "text-blue-100" },
    approved: { label: "Aprovado", bg: "bg-green-400", text: "text-green-100" },
    denied: { label: "Negado", bg: "bg-red-400", text: "text-red-100" },
    canceled: { label: "Cancelado", bg: "bg-gray-400", text: "text-gray-100" },
  };

  // Fetch events paginados (reúne todas as páginas do backend)
  const fetchAllEvents = async () => {
    setLoading(true);
    let allEvents = [];
    let page = 1;
    let hasNext = true;

    try {
      while (hasNext) {
        const response = await api.get('/events/get', { params: { page } });
        if (response.status === 200) {
          const data = response.data;
          allEvents = allEvents.concat(data.events);
          hasNext = data.has_next;
          page += 1;
        } else {
          hasNext = false;
        }
      }
      setEvents(allEvents);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAssignClick = (event) => {
    setSelectedEvent({
      id: event.id,
      code: event.code,
      solicitante: event.user_id,
      setorOrigem: event.destiny?.name || 'Não informado',
      destino: event.destiny?.destiny_type || 'Não definido',
      status: event.status_event,
      saida: event.date_start,
      retorno: event.date_end,
      veiculoIda: event.vehicle_start || '',
      veiculoRetorno: event.vehicle_end || '',
      motoristaIda: event.driver_start || '',
      motoristaRetorno: event.driver_end || '',
      observacao: event.observacao || '',
      motivo: event.reason || '',
      setorDestino: event.destiny?.sector || '',
      quantidadePessoas: event.people_quantity || '',
      whatsappIda: event.whatsapp_start || '',
      whatsappRetorno: event.whatsapp_end || '',
    });
  };

  const handleAssignSubmit = (form) => {
    console.log('Atribuição concluída:', form);
    setSelectedEvent(null);
    setCurrentPage(1);
    fetchAllEvents();
  };

  // Modal de negação
  const handleOpenDenyModal = (eventId) => {
    setDenyEventId(eventId);
    setDenyReason('');
    setDenyModalOpen(true);
    setShowModal(true);
  };

  const handleCloseDenyModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setDenyModalOpen(false);
      setDenyEventId(null);
      setDenyReason('');
    }, 200);
  };

  const handleConfirmDeny = async () => {
    if (!denyEventId || !denyReason.trim() || denyReason.trim().length < 15) return;
    try {
      setLoading(true);
      const payload = { justify_message: denyReason.trim(), deny_user_id: userId };
      await api.put(`/events/${denyEventId}/deny`, payload);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === denyEventId ? { ...ev, status_event: 'denied' } : ev))
      );
      setCurrentPage(1);
      await fetchAllEvents();
      handleCloseDenyModal();
    } catch (error) {
      console.error('Erro ao negar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro de busca
  const filteredEvents = events.filter((event) => {
    const term = searchTerm.toLowerCase();
    const translatedStatus = statusConfig[event.status_event]?.label?.toLowerCase() || '';
    return (
      (event.code && event.code.toLowerCase().includes(term)) ||
      String(event.user_id).includes(term) ||
      (event.destiny?.name?.toLowerCase().includes(term) || false) ||
      (event.destiny?.destiny_type?.toLowerCase().includes(term) || false) ||
      translatedStatus.includes(term) ||
      (event.date_start?.toLowerCase().includes(term) || false)
    );
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalItems = filteredEvents.length;
  const startItem = totalItems === 0 ? 0 : indexOfFirstEvent + 1;
  const endItem = Math.min(indexOfLastEvent, totalItems);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Anterior
        </button>
        {pageNumbers.map((number, index) =>
          number === '...' ? (
            <span key={index} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => setCurrentPage(number)}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === number
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {number}
            </button>
          )
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">Eventos Gerais</h2>
        <div className="flex items-center gap-3">
          <RefreshCw
            size={20}
            className="cursor-pointer text-blue-500 hover:text-blue-700"
            onClick={fetchAllEvents}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-blue-100">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>registros</span>
        </div>

        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-blue-100"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-gray-500">Carregando eventos...</p>
        ) : currentEvents.length === 0 ? (
          <p className="text-gray-500">Nenhum evento encontrado.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 dark:bg-gray-800">
              <tr>
                <th className="py-3 px-4 dark:text-blue-50">Código</th>
                <th className="py-3 px-4 dark:text-blue-50">Destino</th>
                <th className="py-3 px-4 dark:text-blue-50">Início</th>
                <th className="py-3 px-4 dark:text-blue-50">Status</th>
                <th className="py-3 px-4 dark:text-blue-50">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => {
                const isPending = event.status_event?.toLowerCase() === 'pending';
                const isPreApproved = event.status_event?.toLowerCase() === 'pre approved';

                const status = statusConfig[event.status_event] || {};
                return (
                  <tr
                    key={event.id}
                    className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out"
                  >
                    <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">{event.code}</td>
                    <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                      {event.destiny?.name || 'Não definido'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">{event.date_start}</td>
                    <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          status.bg || 'bg-gray-600'
                        } ${status.text || 'text-gray-100'}`}
                      >
                        {status.label || event.status_event}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                      <div className="flex items-center gap-3">
                        <ArrowRightCircle
                          size={20}
                          // className="text-gray-400 opacity-50 cursor-not-allowed"
                          className={`transition ${
                            isPreApproved
                              ? 'text-blue-400 cursor-pointer hover:scale-125'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          } `}
                          onClick={() => isPreApproved && handleAssignClick(event)}
                        />
                        <XCircle
                          size={20}
                          className={`transition ${
                            isPending
                              ? 'text-red-400 cursor-pointer hover:scale-125'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                          onClick={() => isPending && handleOpenDenyModal(event.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Rodapé */}
      <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
        <div className="text-sm text-gray-600 dark:text-blue-100">
          Exibindo de {startItem} à {endItem} de {totalItems} eventos.
        </div>

        <div>{renderPageNumbers()}</div>
      </div>

      {/* Modal de atribuição */}
      <ApproveTransportModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSubmit={handleAssignSubmit}
        preset={selectedEvent || {}}
      />

      {/* Modal de negação */}
      {denyModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            showModal ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-200 ${
              showModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={handleCloseDenyModal}
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4">
              Confirmar ação
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja <span className="font-medium text-red-500">negar</span> este
              evento?
            </p>

            <textarea
              placeholder="Descreva o motivo da negação..."
              value={denyReason}
              onChange={(e) => {
                if (e.target.value.length <= 200) setDenyReason(e.target.value);
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-blue-100 resize-none"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mb-4">{denyReason.length}/200</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleCloseDenyModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded-md text-white transition ${
                  denyReason.trim().length < 15 || loading
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={handleConfirmDeny}
                disabled={denyReason.trim().length < 15 || loading}
              >
                {loading ? 'Negando...' : 'Negar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveTransportTableView;