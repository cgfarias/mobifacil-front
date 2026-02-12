import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightCircle, XCircle, RefreshCw, X } from 'lucide-react';
import AssignModal from './AssignModal';
import api from '../../api/axios';

const HomeTableView = ({ events = [], showViewAll = true, onEventUpdated, onRefresh }) => {
  const [openAssign, setOpenAssign] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // Modal de negação
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyEventId, setDenyEventId] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);

  // Recupera userId como inteiro
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) return;
  
    try {
      const userData = JSON.parse(authData);
  
      // Aqui, user_id está direto no objeto userData
      if (userData && typeof userData.user_id !== 'undefined') {
        setUserId(parseInt(userData.user_id, 10));
      } else {
        console.warn('⚠️ user_id não encontrado no authData:', userData);
      }
    } catch (err) {
      console.error('Erro ao ler authData:', err);
    }
  }, []);
  
  

  // Verifica se a data é hoje
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const [datePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);

    const today = new Date();
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // 🔥 Apenas eventos do dia atual
  // const todayEventsOnly = events.filter((event) => isToday(event.date_start));

  // 🔎 Filtro de busca (agora filtrando SOMENTE os eventos de hoje)
  // const filteredEvents = todayEventsOnly.filter((event) => {
  //   const term = searchTerm.toLowerCase();
  //   return (
  //     event.code?.toLowerCase().includes(term) ||
  //     String(event.user_id).includes(term) ||
  //     (event.destiny?.name?.toLowerCase().includes(term) || false) ||
  //     (event.destiny?.destiny_type?.toLowerCase().includes(term) || false) ||
  //     (event.status_event?.toLowerCase().includes(term) || false) ||
  //     (event.date_start?.toLowerCase().includes(term) || false) ||
  //     (event.date_end?.toLowerCase().includes(term) || false)
  //   );
  // });
  
  // 🔎 Filtro de busca (agora filtrando TODOS os eventos de hoje)
  const filteredEvents = events.filter((event) => {
    const term = searchTerm.toLowerCase();
    return (
      event.code?.toLowerCase().includes(term) ||
      String(event.user_id).includes(term) ||
      (event.destiny?.name?.toLowerCase().includes(term) || false) ||
      (event.destiny?.destiny_type?.toLowerCase().includes(term) || false) ||
      (event.status_event?.toLowerCase().includes(term) || false) ||
      (event.date_start?.toLowerCase().includes(term) || false) ||
      (event.date_end?.toLowerCase().includes(term) || false)
    );
  });


  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  // NOVO CODE
  const totalItems = filteredEvents.length;
  const startItem = totalItems === 0 ? 0 : indexOfFirstEvent + 1;
  const endItem = Math.min(indexOfLastEvent, totalItems);


  const handleAssignClick = (event) => {
    setCurrentPreset({
      ...event,
      solicitante: event.user_id,
      setorOrigem: event.destiny?.name || 'Não informado',
      destino: event.destiny?.destiny_type || 'Não definido',
      veiculoIda: event.vehicle_start || '',
      veiculoRetorno: event.vehicle_end || '',
      motoristaIda: '',
      motoristaRetorno: '',
      whatsappIda: '',
      whatsappRetorno: '',
    });
    setOpenAssign(true);
  };

  const handleAssignSubmit = (updatedEvent) => {
    if (onEventUpdated) onEventUpdated(updatedEvent);
    setOpenAssign(false);
    setCurrentPreset(null);
  };

  // Abrir modal de negar
  const handleOpenDenyModal = (eventId) => {
    setDenyEventId(eventId);
    setDenyReason('');
    setDenyModalOpen(true);
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseDenyModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setDenyModalOpen(false);
      setDenyEventId(null);
      setDenyReason('');
    }, 200);
  };

  // ✅ Negar evento e atualizar lista
  const handleConfirmDeny = async () => {
    if (!denyEventId || !denyReason.trim() || denyReason.trim().length < 15) return;
    try {
      setLoading(true);

      const payload = {
        justify_message: denyReason.trim(),
        deny_user_id: userId,
      };

      await api.put(`/events/${denyEventId}/deny`, payload);

      // Atualiza o evento local (opcional)
      if (onEventUpdated) onEventUpdated({ id: denyEventId, status_event: 'Negado' });

      // Fecha modal
      handleCloseDenyModal();

      // 🔄 Atualiza listagem completa
      if (onRefresh) onRefresh();

    } catch (error) {
      console.error('Erro ao negar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">Eventos Pendentes do Dia</h2>
        <div className="flex items-center gap-3">
          {showViewAll && (
            <Link to="/ApproveTransport" className="text-blue-600 text-sm hover:underline dark:text-blue-400">
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

      {/* Filtros */}
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

        <div className="relative text-gray-700 dark:text-blue-100">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        {currentEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-blue-100">Nenhum evento encontrado.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 dark:bg-gray-800">
              <tr>
                <th className="py-3 px-4 dark:text-blue-50">Código</th>
                {/* <th className="py-3 px-4 dark:text-blue-50">Usuário</th> */}
                <th className="py-3 px-4 dark:text-blue-50">Destino</th>
                <th className="py-3 px-4 dark:text-blue-50">Início</th>
                <th className="py-3 px-4 dark:text-blue-50">Fim</th>
                <th className="py-3 px-4 dark:text-blue-50">Status</th>
                <th className="py-3 px-4 dark:text-blue-50">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => (
                <tr
                  key={event.id}
                  className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out hover:shadow-sm transform"
                >
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-blue-400 transition-colors duration-200">{event.code}</td>
                  {/* <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.user_id}</td> */}
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.destiny?.name || 'Não definido'}</td>
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.date_start}</td>
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.date_end}</td>
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 group-hover:shadow-sm 
                        ${event.status_event === 'pending'
                          ? 'bg-yellow-400 text-yellow-100'
                          : 'bg-gray-400 text-gray-100'}`}
                    >
                      {event.status_event === 'pending' ? 'Pendente' : event.status_event}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
                    <div className="flex items-center gap-3">
                      <ArrowRightCircle
                        size={20}
                        className="text-green-400 cursor-pointer hover:scale-125 transition duration-300 ease-in-out"
                        onClick={() => handleAssignClick(event)}
                      />
                      <XCircle
                        size={20}
                        className="text-red-400 cursor-pointer hover:scale-125 transition duration-300 ease-in-out"
                        onClick={() => handleOpenDenyModal(event.id)}
                        disabled={loading}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {/* <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Próximo
        </button>
      </div> */}

      {/* NOVO CODE - Nova paginação */}
      {/* Rodapé com contagem + paginação */}
      <div className="flex justify-between items-center mt-4 flex-wrap gap-2">

        {/* Texto de "Exibindo de..." */}
        <div className="text-sm text-gray-600 dark:text-blue-100">
          Exibindo de {startItem} à {endItem} de {totalItems} eventos.
        </div>

        {/* Paginação */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Anterior
          </button>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </div>


      {/* Modal de atribuição */}
      <AssignModal
        isOpen={openAssign}
        onClose={() => setOpenAssign(false)}
        onSubmit={handleAssignSubmit}
        preset={currentPreset || {}}
        eventId={currentPreset?.id}
        onRefresh={onRefresh}
        events={events}
      />

      {/* Modal de Negação */}
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
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              onClick={handleCloseDenyModal}
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4">
              Confirmar ação
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja <span className="font-medium text-red-500">negar</span> este evento?
            </p>

            <textarea
              placeholder="Descreva o motivo da negação..."
              value={denyReason}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setDenyReason(e.target.value);
                }
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-blue-100 resize-none"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mb-4">{denyReason.length}/200</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                onClick={handleCloseDenyModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded-md text-white transition shadow-md ${
                  denyReason.trim().length < 15 || loading
                    ? 'bg-red-300 cursor-not-allowed'
                    : 'bg-red-500 cursor-pointer hover:bg-red-600'
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

export default HomeTableView;

























// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { ArrowRightCircle, XCircle, RefreshCw, X } from 'lucide-react';
// import AssignModal from './AssignModal';
// import api from '../../api/axios';

// const HomeTableView = ({ events = [], showViewAll = true, onEventUpdated, onRefresh }) => {
//   const [openAssign, setOpenAssign] = useState(false);
//   const [currentPreset, setCurrentPreset] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [loading, setLoading] = useState(false);

//   // Modal de negação
//   const [denyModalOpen, setDenyModalOpen] = useState(false);
//   const [denyEventId, setDenyEventId] = useState(null);
//   const [denyReason, setDenyReason] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [userId, setUserId] = useState(null);

//   // Recupera userId como inteiro
//   useEffect(() => {
//     const authData = localStorage.getItem('authData');
//     if (!authData) return;
  
//     try {
//       const userData = JSON.parse(authData);
  
//       // Aqui, user_id está direto no objeto userData
//       if (userData && typeof userData.user_id !== 'undefined') {
//         setUserId(parseInt(userData.user_id, 10));
//       } else {
//         console.warn('⚠️ user_id não encontrado no authData:', userData);
//       }
//     } catch (err) {
//       console.error('Erro ao ler authData:', err);
//     }
//   }, []);
  
  

//   // 🔎 Filtro de busca
//   const filteredEvents = events.filter((event) => {
//     const term = searchTerm.toLowerCase();
//     return (
//       event.code?.toLowerCase().includes(term) ||
//       String(event.user_id).includes(term) ||
//       (event.destiny?.name?.toLowerCase().includes(term) || false) ||
//       (event.destiny?.destiny_type?.toLowerCase().includes(term) || false) ||
//       (event.status_event?.toLowerCase().includes(term) || false) ||
//       (event.date_start?.toLowerCase().includes(term) || false) ||
//       (event.date_end?.toLowerCase().includes(term) || false)
//     );
//   });

//   const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
//   const indexOfLastEvent = currentPage * itemsPerPage;
//   const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
//   const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

//   const handleAssignClick = (event) => {
//     setCurrentPreset({
//       ...event,
//       solicitante: event.user_id,
//       setorOrigem: event.destiny?.name || 'Não informado',
//       destino: event.destiny?.destiny_type || 'Não definido',
//       veiculoIda: event.vehicle_start || '',
//       veiculoRetorno: event.vehicle_end || '',
//       motoristaIda: '',
//       motoristaRetorno: '',
//       whatsappIda: '',
//       whatsappRetorno: '',
//     });
//     setOpenAssign(true);
//   };

//   const handleAssignSubmit = (updatedEvent) => {
//     if (onEventUpdated) onEventUpdated(updatedEvent);
//     setOpenAssign(false);
//     setCurrentPreset(null);
//   };

//   // Abrir modal de negar
//   const handleOpenDenyModal = (eventId) => {
//     setDenyEventId(eventId);
//     setDenyReason('');
//     setDenyModalOpen(true);
//     setShowModal(true);
//   };

//   // Fechar modal
//   const handleCloseDenyModal = () => {
//     setShowModal(false);
//     setTimeout(() => {
//       setDenyModalOpen(false);
//       setDenyEventId(null);
//       setDenyReason('');
//     }, 200);
//   };

//   // ✅ Negar evento e atualizar lista
//   const handleConfirmDeny = async () => {
//     if (!denyEventId || !denyReason.trim() || denyReason.trim().length < 15) return;
//     try {
//       setLoading(true);

//       const payload = {
//         justify_message: denyReason.trim(),
//         deny_user_id: userId,
//       };

//       await api.put(`/events/${denyEventId}/deny`, payload);

//       // Atualiza o evento local (opcional)
//       if (onEventUpdated) onEventUpdated({ id: denyEventId, status_event: 'Negado' });

//       // Fecha modal
//       handleCloseDenyModal();

//       // 🔄 Atualiza listagem completa
//       if (onRefresh) onRefresh();

//     } catch (error) {
//       console.error('Erro ao negar evento:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full">
//       {/* Cabeçalho */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">Eventos Pendentes</h2>
//         <div className="flex items-center gap-3">
//           {showViewAll && (
//             <Link to="/ApproveTransport" className="text-blue-600 text-sm hover:underline dark:text-blue-400">
//               Ver todos
//             </Link>
//           )}
//           <RefreshCw
//             size={20}
//             className="cursor-pointer text-blue-500 hover:text-blue-700"
//             onClick={() => window.location.reload()}
//           />
//         </div>
//       </div>

//       {/* Filtros */}
//       <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
//         <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-blue-100">
//           <span>Mostrar</span>
//           <select
//             value={itemsPerPage}
//             onChange={(e) => {
//               setItemsPerPage(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//             className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
//           >
//             <option value={10}>10</option>
//             <option value={25}>25</option>
//             <option value={50}>50</option>
//           </select>
//           <span>registros</span>
//         </div>

//         <div className="relative text-gray-700 dark:text-blue-100">
//           <input
//             type="text"
//             placeholder="Buscar..."
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               setCurrentPage(1);
//             }}
//             className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
//           />
//         </div>
//       </div>

//       {/* Tabela */}
//       <div className="overflow-x-auto">
//         {currentEvents.length === 0 ? (
//           <p className="text-gray-500 dark:text-blue-100">Nenhum evento encontrado.</p>
//         ) : (
//           <table className="w-full text-left">
//             <thead className="bg-gray-50 text-xs uppercase text-gray-400 dark:bg-gray-800">
//               <tr>
//                 <th className="py-3 px-4 dark:text-blue-50">Código</th>
//                 {/* <th className="py-3 px-4 dark:text-blue-50">Usuário</th> */}
//                 <th className="py-3 px-4 dark:text-blue-50">Destino</th>
//                 <th className="py-3 px-4 dark:text-blue-50">Início</th>
//                 <th className="py-3 px-4 dark:text-blue-50">Fim</th>
//                 <th className="py-3 px-4 dark:text-blue-50">Status</th>
//                 <th className="py-3 px-4 dark:text-blue-50">Ações</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentEvents.map((event) => (
//                 <tr
//                   key={event.id}
//                   className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out hover:shadow-sm transform"
//                 >
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-blue-400 transition-colors duration-200">{event.code}</td>
//                   {/* <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.user_id}</td> */}
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.destiny?.name || 'Não definido'}</td>
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.date_start}</td>
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200 group-hover:text-gray-400 transition-colors duration-200">{event.date_end}</td>
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
//                     <span
//                       className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 group-hover:shadow-sm 
//                         ${event.status_event === 'pending'
//                           ? 'bg-yellow-400 text-yellow-100'
//                           : 'bg-gray-400 text-gray-100'}`}
//                     >
//                       {event.status_event === 'pending' ? 'Pendente' : event.status_event}
//                     </span>
//                   </td>
//                   <td className="py-4 px-4 text-sm text-gray-800 dark:text-blue-200">
//                     <div className="flex items-center gap-3">
//                       <ArrowRightCircle
//                         size={20}
//                         className="text-green-400 cursor-pointer hover:scale-125 transition duration-300 ease-in-out"
//                         onClick={() => handleAssignClick(event)}
//                       />
//                       <XCircle
//                         size={20}
//                         className="text-red-400 cursor-pointer hover:scale-125 transition duration-300 ease-in-out"
//                         onClick={() => handleOpenDenyModal(event.id)}
//                         disabled={loading}
//                       />
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Paginação */}
//       <div className="flex justify-end gap-2 mt-3">
//         <button
//           onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//           disabled={currentPage === 1}
//           className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
//         >
//           Anterior
//         </button>
//         <button
//           onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//           disabled={currentPage === totalPages || totalPages === 0}
//           className="px-3 py-1 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50"
//         >
//           Próximo
//         </button>
//       </div>

//       {/* Modal de atribuição */}
//       <AssignModal
//         isOpen={openAssign}
//         onClose={() => setOpenAssign(false)}
//         onSubmit={handleAssignSubmit}
//         preset={currentPreset || {}}
//         eventId={currentPreset?.id}
//         onRefresh={onRefresh}
//         events={events}
//       />

//       {/* Modal de Negação */}
//       {denyModalOpen && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
//             showModal ? 'opacity-100' : 'opacity-0'
//           }`}
//         >
//           <div
//             className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-200 ${
//               showModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
//             }`}
//           >
//             <button
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
//               onClick={handleCloseDenyModal}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4">
//               Confirmar ação
//             </h2>
//             <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
//               Tem certeza que deseja <span className="font-medium text-red-500">negar</span> este evento?
//             </p>

//             <textarea
//               placeholder="Descreva o motivo da negação..."
//               value={denyReason}
//               onChange={(e) => {
//                 if (e.target.value.length <= 200) {
//                   setDenyReason(e.target.value);
//                 }
//               }}
//               className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-blue-100 resize-none"
//               rows={4}
//               maxLength={200}
//             />
//             <p className="text-xs text-gray-500 mb-4">{denyReason.length}/200</p>

//             <div className="flex justify-end gap-3">
//               <button
//                 className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
//                 onClick={handleCloseDenyModal}
//                 disabled={loading}
//               >
//                 Cancelar
//               </button>
//               <button
//                 className={`px-4 py-2 rounded-md text-white transition shadow-md ${
//                   denyReason.trim().length < 15 || loading
//                     ? 'bg-red-300 cursor-not-allowed'
//                     : 'bg-red-500 cursor-pointer hover:bg-red-600'
//                 }`}
//                 onClick={handleConfirmDeny}
//                 disabled={denyReason.trim().length < 15 || loading}
//               >
//                 {loading ? 'Negando...' : 'Negar'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default HomeTableView;