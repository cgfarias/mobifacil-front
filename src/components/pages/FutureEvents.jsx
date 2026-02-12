import { useState, useRef, useEffect } from "react";
import {
  Search,
  CalendarDays,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  GalleryVerticalEnd,
  Share2,
  XCircle,
  CircleAlert,
  CalendarSearch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
import EventEditModal from "./EventEditModal";
import NavBar from "../includes/NavBar";
import api from "../../api/axios";
import { useDarkMode } from "../../context/ThemeContext"; // ✅ Importa o contexto global

function FutureEvents() {
  const navigate = useNavigate();

  // ✅ Usa o darkMode global (com persistência via localStorage)
  const { darkMode } = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [futureEvents, setFutureEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancelamento
  const [cancelEventId, setCancelEventId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const futureRef = useRef(null);
  const [futureFadeLeft, setFutureFadeLeft] = useState(false);
  const [futureFadeRight, setFutureFadeRight] = useState(true);

  const handleOpenDetailsModal = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  // Edição movida para EventEditModal (centraliza formatação e PUT)

  // Cancelamento
  const openCancelModal = (eventId) => {
    setCancelEventId(eventId);
    setShowCancelModal(true);
  };

  const confirmCancelEvent = async () => {
    if (!cancelEventId) return;
    try {
      await api.put(`/events/${cancelEventId}/cancel`);
      await fetchFutureEvents();
    } catch (error) {
      console.error("❌ Erro ao cancelar evento:", error);
    } finally {
      setShowCancelModal(false);
      setCancelEventId(null);
    }
  };

  const handleScroll = (ref, setLeft, setRight) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setLeft(scrollLeft > 0);
      setRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 🔄 Busca TODAS as páginas da API sem limite de 100 — COM LOGS
  const fetchAllEventsFromAPI = async () => {
    const allEvents = [];
    let currentPage = 1;

    // console.log("🔵 Iniciando busca de TODAS as páginas de /events/get...");

    try {
      while (true) {
        // console.log(`📡 Buscando página ${currentPage}...`);

        const response = await api.get(`/events/get?page=${currentPage}`);

        const events = response.data?.events || [];
        // console.log(`📥 Página ${currentPage} retornou ${events.length} eventos`);

        if (events.length === 0) {
          // console.log("🟡 Nenhum evento encontrado. Fim das páginas.");
          break;
        }

        allEvents.push(...events);
        // console.log(`📊 Total acumulado até agora: ${allEvents.length}`);

        currentPage++;
      }

      // console.log("🟢 FINALIZADO: Total de eventos carregados:", allEvents.length);
      return allEvents;

    } catch (error) {
      console.error("❌ Erro ao buscar páginas:", error);
      return [];
    }
  };

  // ✅ Busca eventos futuros (data > hoje)
  const fetchFutureEvents = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("authData"));
      const userId = authData?.user_id;

      if (!userId) {
        console.warn("Usuário não identificado no localStorage.");
        setLoading(false);
        return;
      }

      // 🔄 AGORA BUSCA TODAS AS PÁGINAS
      // console.log("📡 Buscando TODAS as páginas da API...");
      const events = await fetchAllEventsFromAPI();

      // console.log("📦 Total de eventos recebidos:", events.length);

      // 🔍 Filtra apenas os eventos do usuário
      const userEvents = events.filter((e) => e.user_id === userId);
      // console.log("👤 Eventos do usuário:", userEvents.length);

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [datePart] = dateStr.split(" ");
        const [day, month, year] = datePart.split("/");
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureList = userEvents.filter((e) => {
        const eventDate = parseDate(e.date_start);
        return eventDate && eventDate > today;
      });

      // Ordena por data crescente
      futureList.sort((a, b) => {
        const dateA = parseDate(a.date_start);
        const dateB = parseDate(b.date_start);
        return dateA - dateB;
      });

      setFutureEvents(futureList);
    } catch (error) {
      console.error("❌ Erro ao buscar eventos futuros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFutureEvents();
  }, []);

  // 🔍 Filtro de busca com status traduzidos
  const filterEvents = (events) => {
    const term = searchTerm.toLowerCase();

    const translateStatus = (status) => {
      switch (status?.toLowerCase()) {
        case "pre approved":
        case "approved":
          return "aprovado";
        case "pending":
          return "pendente";
        case "canceled":
          return "cancelado";
        case "denied":
          return "negado";
        default:
          return "";
      }
    };

    return events.filter((e) => {
      const translatedStatus = translateStatus(e.status_event);
      return (
        e.destiny?.name?.toLowerCase().includes(term) ||
        e.code?.toLowerCase().includes(term) ||
        e.status_event?.toLowerCase().includes(term) ||
        translatedStatus.includes(term)
      );
    });
  };

  const filteredFuture = filterEvents(futureEvents);

  // 🎨 Cores e traduções
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "aprovado":
      case "pre approved":
        return "green";
      case "pending":
      case "pendente":
        return "yellow";
      case "canceled":
      case "cancelado":
        return "gray";
      case "denied":
      case "negado":
        return "red";
      default:
        return "gray";
    }
  };

  const translateStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "pre approved":
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "canceled":
        return "Cancelado";
      case "denied":
        return "Negado";
      default:
        return "Desconhecido";
    }
  };

  // 🧱 Card do evento
  const renderCard = (event) => {
    const color = getStatusColor(event.status_event);
    const translatedStatus = translateStatus(event.status_event);

    const bottomBorderColor =
      color === "green"
        ? "border-b-green-400"
        : color === "yellow"
        ? "border-b-yellow-400"
        : color === "gray"
        ? "border-b-gray-400"
        : "border-b-red-500";

    const gradientClasses = darkMode
      ? "bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#0f172a]"
      : "bg-gradient-to-b from-white via-gray-50 to-gray-100";

    return (
      <div
        key={event.id}
        onClick={() => handleOpenDetailsModal(event)}
        className={`flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] lg:w-[30%]
          rounded-2xl p-5 border border-b-4 ${bottomBorderColor} 
          ${darkMode ? "border-gray-600" : "border-gray-200"} 
          ${gradientClasses} transition-all hover:shadow-lg hover:-translate-y-[2px] 
          snap-start cursor-pointer`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</span>
            <span
              className={`mt-1 px-3 py-1 text-xs font-semibold rounded-full w-fit border transition-all duration-300 ${
                darkMode
                  ? color === "green"
                    ? "bg-green-600/25 text-green-300 border-green-400/30 hover:bg-green-600/40"
                    : color === "yellow"
                    ? "bg-yellow-500/25 text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/40"
                    : color === "gray"
                    ? "bg-gray-600/25 text-gray-300 border-gray-400/30 hover:bg-gray-600/40"
                    : "bg-red-600/25 text-red-300 border-red-400/30 hover:bg-red-600/40"
                  : color === "green"
                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  : color === "yellow"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
                  : color === "gray"
                  ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
              }`}
            >
              {translatedStatus}
            </span>
          </div>

          <div className="text-right">
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Código</span>
            <p className="text-sm font-semibold text-[#2F95FF]">{event.code}</p>
          </div>
        </div>

        <div className={`border-t my-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`} />

        {/* Info */}
        <div className="flex items-center gap-4 mb-3 text-sm flex-wrap">
          {/* Só mostra se houver date_start */}
          {event.date_start && (
            <div className="flex items-center gap-2">
              <Clock size={15} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Data e Hora para Partida
                </p>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {event.date_start}
                </p>
              </div>
            </div>
          )}

          {/* Só mostra se houver date_end */}
          {event.date_end && (
            <div className="flex items-center gap-2">
              <Clock size={15} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Data e Hora para Retorno
                </p>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {event.date_end}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-sm mb-4">
          <MapPin size={15} className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`} />
          <div>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Destino</p>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {event.destiny?.name || "Não informado"}
            </p>
          </div>
        </div>

        {event.status_event?.toLowerCase() === "pending" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openCancelModal(event.id);
            }}
            className={`w-full py-2 mt-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              darkMode
                ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Cancelar Evento
          </button>
        )}
      </div>
    );
  };

  const showArrows = (events) => events.length >= 4;

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#1e293b] text-white" : "bg-blue-50 text-gray-800"
      }`}
    >
      {/* ✅ NavBar já cuida do toggle global */}
      <NavBar />

      <main className="flex-1 p-8">
        <section className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                MEUS AGENDAMENTOS
              </h2>
              <p className={`text-md ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Visualize todos os eventos futuros agendados
              </p>
            </div>
          </div>

          {/* Barra de ações */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/event-history")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <History size={16} />
                Histórico
              </button>
              <button
                onClick={() => navigate("/schedule-event")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Calendar size={16} />
                Eventos
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <GalleryVerticalEnd size={16} />
                Futuros
              </button>
              <button
                onClick={() => navigate("/shared-events")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <Share2 size={16} />
                Compartilhados
              </button>
              <button
                onClick={() => navigate("/all-events")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <CalendarSearch size={16} />
                Todos os Eventos
              </button>
            </div>

            {/* Campo de busca */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar por destino, código ou status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    darkMode
                      ? "bg-[#0f172a] border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* EVENTOS FUTUROS */}
          <div className="mb-6 flex items-center gap-2">
            <CalendarDays
              className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
              size={22}
            />
            <h3
              className={`text-lg font-semibold ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Eventos Futuros
            </h3>
          </div>

          {/* Lista de cards */}
          {loading ? (
            <p className="text-center text-gray-400 italic mb-10">
              Carregando eventos futuros...
            </p>
          ) : filteredFuture.length > 0 ? (
            <div className="relative">
              {showArrows(filteredFuture) && (
                <>
                  <button
                    onClick={() => scroll(futureRef, "left")}
                    className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
                      darkMode
                        ? "bg-gray-700/80 hover:bg-gray-600"
                        : "bg-white/80 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll(futureRef, "right")}
                    className={`absolute -right-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
                      darkMode
                        ? "bg-gray-700/80 hover:bg-gray-600"
                        : "bg-white/80 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <div
                ref={futureRef}
                onScroll={() =>
                  handleScroll(futureRef, setFutureFadeLeft, setFutureFadeRight)
                }
                className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
              >
                {filteredFuture.map(renderCard)}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDays
                className={`mx-auto mb-4 ${
                  darkMode ? "text-gray-600" : "text-gray-400"
                }`}
                size={48}
              />
              <p
                className={`text-lg ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Nenhum evento futuro encontrado.
              </p>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Os eventos futuros aparecerão aqui automaticamente.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer
        className={`text-center py-4 text-sm ${
          darkMode
            ? "bg-gray-800 border-gray-600 text-gray-400"
            : "bg-blue-50 border-gray-200 text-gray-500"
        }`}
      >
        © {new Date().getFullYear()} MobiFácil. Todos os direitos reservados.
      </footer>

      {/* Modal de detalhes */}
      {/* Exibição apenas (não pendente) usa o mesmo modal do histórico */}
      <ScheduleEventDetailsModal
        isOpen={isDetailsModalOpen && ((selectedEvent?.status_event || "").toLowerCase() !== "pending" && (selectedEvent?.status_event || "").toLowerCase() !== "pendente")}
        onClose={handleCloseDetailsModal}
        event={selectedEvent}
        darkMode={darkMode}
      />

      {/* Edição somente quando pendente */}
      <EventEditModal
        isOpen={isDetailsModalOpen && ((selectedEvent?.status_event || "").toLowerCase() === "pending" || (selectedEvent?.status_event || "").toLowerCase() === "pendente")}
        onClose={handleCloseDetailsModal}
        event={selectedEvent}
        darkMode={darkMode}
        onUpdated={() => {
          fetchFutureEvents();
        }}
      />

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            showCancelModal ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-200 ${
              showCancelModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              onClick={() => setShowCancelModal(false)}
            >
              <XCircle size={20} />
            </button>

            <div className="text-center">

              <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
                <CircleAlert size={22} className="text-red-500 dark:text-red-400" /> Confirmar Cancelamento
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tem certeza que deseja cancelar este evento? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Voltar
              </button>
              <button
                onClick={confirmCancelEvent}
                className={`px-4 py-2 rounded-md text-white transition shadow-md cursor-pointer ${darkMode ? "bg-red-400 hover:bg-red-600 text-gray-300" : "bg-red-500 hover:bg-red-600"}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FutureEvents;


















































// import { useState, useRef, useEffect } from "react";
// import {
//   Search,
//   CalendarDays,
//   MapPin,
//   Clock,
//   ChevronLeft,
//   ChevronRight,
//   Calendar,
//   History,
//   GalleryVerticalEnd,
//   Share2,
//   XCircle,
//   CircleAlert,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
// import EventEditModal from "./EventEditModal";
// import NavBar from "../includes/NavBar";
// import api from "../../api/axios";
// import { useDarkMode } from "../../context/ThemeContext"; // ✅ Importa o contexto global

// function FutureEvents() {
//   const navigate = useNavigate();

//   // ✅ Usa o darkMode global (com persistência via localStorage)
//   const { darkMode } = useDarkMode();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [futureEvents, setFutureEvents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Cancelamento
//   const [cancelEventId, setCancelEventId] = useState(null);
//   const [showCancelModal, setShowCancelModal] = useState(false);

//   const futureRef = useRef(null);
//   const [futureFadeLeft, setFutureFadeLeft] = useState(false);
//   const [futureFadeRight, setFutureFadeRight] = useState(true);

//   const handleOpenDetailsModal = (event) => {
//     setSelectedEvent(event);
//     setIsDetailsModalOpen(true);
//   };

//   const handleCloseDetailsModal = () => {
//     setIsDetailsModalOpen(false);
//     setSelectedEvent(null);
//   };

//   // Edição movida para EventEditModal (centraliza formatação e PUT)

//   // Cancelamento
//   const openCancelModal = (eventId) => {
//     setCancelEventId(eventId);
//     setShowCancelModal(true);
//   };

//   const confirmCancelEvent = async () => {
//     if (!cancelEventId) return;
//     try {
//       await api.put(`/events/${cancelEventId}/cancel`);
//       await fetchFutureEvents();
//     } catch (error) {
//       console.error("❌ Erro ao cancelar evento:", error);
//     } finally {
//       setShowCancelModal(false);
//       setCancelEventId(null);
//     }
//   };

//   const handleScroll = (ref, setLeft, setRight) => {
//     if (ref.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = ref.current;
//       setLeft(scrollLeft > 0);
//       setRight(scrollLeft < scrollWidth - clientWidth - 1);
//     }
//   };

//   const scroll = (ref, direction) => {
//     if (ref.current) {
//       const scrollAmount = 400;
//       ref.current.scrollBy({
//         left: direction === "left" ? -scrollAmount : scrollAmount,
//         behavior: "smooth",
//       });
//     }
//   };

//   // ✅ Busca eventos futuros (data > hoje)
//   const fetchFutureEvents = async () => {
//     try {
//       setLoading(true);
//       const authData = JSON.parse(localStorage.getItem("authData"));
//       const userId = authData?.user_id;

//       if (!userId) {
//         console.warn("Usuário não identificado no localStorage.");
//         setLoading(false);
//         return;
//       }

//       const response = await api.get("/events/get");
//       const events = response.data?.events || [];

//       const userEvents = events.filter((e) => e.user_id === userId);

//       const parseDate = (dateStr) => {
//         if (!dateStr) return null;
//         const [datePart] = dateStr.split(" ");
//         const [day, month, year] = datePart.split("/");
//         return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
//       };

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const futureList = userEvents.filter((e) => {
//         const eventDate = parseDate(e.date_start);
//         return eventDate && eventDate > today;
//       });

//       // Ordena por data crescente
//       futureList.sort((a, b) => {
//         const dateA = parseDate(a.date_start);
//         const dateB = parseDate(b.date_start);
//         return dateA - dateB;
//       });

//       setFutureEvents(futureList);
//     } catch (error) {
//       console.error("❌ Erro ao buscar eventos futuros:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchFutureEvents();
//   }, []);

//   // 🔍 Filtro de busca com status traduzidos
//   const filterEvents = (events) => {
//     const term = searchTerm.toLowerCase();

//     const translateStatus = (status) => {
//       switch (status?.toLowerCase()) {
//         case "pre approved":
//         case "approved":
//           return "aprovado";
//         case "pending":
//           return "pendente";
//         case "canceled":
//           return "cancelado";
//         case "denied":
//           return "negado";
//         default:
//           return "";
//       }
//     };

//     return events.filter((e) => {
//       const translatedStatus = translateStatus(e.status_event);
//       return (
//         e.destiny?.name?.toLowerCase().includes(term) ||
//         e.code?.toLowerCase().includes(term) ||
//         e.status_event?.toLowerCase().includes(term) ||
//         translatedStatus.includes(term)
//       );
//     });
//   };

//   const filteredFuture = filterEvents(futureEvents);

//   // 🎨 Cores e traduções
//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "approved":
//       case "aprovado":
//       case "pre approved":
//         return "green";
//       case "pending":
//       case "pendente":
//         return "yellow";
//       case "canceled":
//       case "cancelado":
//         return "gray";
//       case "denied":
//       case "negado":
//         return "red";
//       default:
//         return "gray";
//     }
//   };

//   const translateStatus = (status) => {
//     switch (status?.toLowerCase()) {
//       case "pre approved":
//       case "approved":
//         return "Aprovado";
//       case "pending":
//         return "Pendente";
//       case "canceled":
//         return "Cancelado";
//       case "denied":
//         return "Negado";
//       default:
//         return "Desconhecido";
//     }
//   };

//   // 🧱 Card do evento
//   const renderCard = (event) => {
//     const color = getStatusColor(event.status_event);
//     const translatedStatus = translateStatus(event.status_event);

//     const bottomBorderColor =
//       color === "green"
//         ? "border-b-green-400"
//         : color === "yellow"
//         ? "border-b-yellow-400"
//         : color === "gray"
//         ? "border-b-gray-400"
//         : "border-b-red-500";

//     const gradientClasses = darkMode
//       ? "bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#0f172a]"
//       : "bg-gradient-to-b from-white via-gray-50 to-gray-100";

//     return (
//       <div
//         key={event.id}
//         onClick={() => handleOpenDetailsModal(event)}
//         className={`flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] lg:w-[30%]
//           rounded-2xl p-5 border border-b-4 ${bottomBorderColor} 
//           ${darkMode ? "border-gray-600" : "border-gray-200"} 
//           ${gradientClasses} transition-all hover:shadow-lg hover:-translate-y-[2px] 
//           snap-start cursor-pointer`}
//       >
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex flex-col">
//             <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</span>
//             <span
//               className={`mt-1 px-3 py-1 text-xs font-semibold rounded-full w-fit border transition-all duration-300 ${
//                 darkMode
//                   ? color === "green"
//                     ? "bg-green-600/25 text-green-300 border-green-400/30 hover:bg-green-600/40"
//                     : color === "yellow"
//                     ? "bg-yellow-500/25 text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/40"
//                     : color === "gray"
//                     ? "bg-gray-600/25 text-gray-300 border-gray-400/30 hover:bg-gray-600/40"
//                     : "bg-red-600/25 text-red-300 border-red-400/30 hover:bg-red-600/40"
//                   : color === "green"
//                   ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
//                   : color === "yellow"
//                   ? "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
//                   : color === "gray"
//                   ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
//                   : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
//               }`}
//             >
//               {translatedStatus}
//             </span>
//           </div>

//           <div className="text-right">
//             <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Código</span>
//             <p className="text-sm font-semibold text-[#2F95FF]">{event.code}</p>
//           </div>
//         </div>

//         <div className={`border-t my-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`} />

//         {/* Info */}
//         <div className="flex items-center gap-4 mb-3 text-sm flex-wrap">
//           {/* Só mostra se houver date_start */}
//           {event.date_start && (
//             <div className="flex items-center gap-2">
//               <Clock size={15} className={darkMode ? "text-gray-400" : "text-gray-500"} />
//               <div>
//                 <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
//                   Data e Hora para Partida
//                 </p>
//                 <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
//                   {event.date_start}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Só mostra se houver date_end */}
//           {event.date_end && (
//             <div className="flex items-center gap-2">
//               <Clock size={15} className={darkMode ? "text-gray-400" : "text-gray-500"} />
//               <div>
//                 <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
//                   Data e Hora para Retorno
//                 </p>
//                 <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
//                   {event.date_end}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex items-start gap-2 text-sm mb-4">
//           <MapPin size={15} className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`} />
//           <div>
//             <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Destino</p>
//             <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
//               {event.destiny?.name || "Não informado"}
//             </p>
//           </div>
//         </div>

//         {event.status_event?.toLowerCase() === "pending" && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               openCancelModal(event.id);
//             }}
//             className={`w-full py-2 mt-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
//               darkMode
//                 ? "bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800"
//                 : "bg-red-500 hover:bg-red-600 text-white"
//             }`}
//           >
//             Cancelar Evento
//           </button>
//         )}
//       </div>
//     );
//   };

//   const showArrows = (events) => events.length >= 4;

//   return (
//     <div
//       className={`flex flex-col min-h-screen transition-colors duration-300 ${
//         darkMode ? "bg-[#1e293b] text-white" : "bg-blue-50 text-gray-800"
//       }`}
//     >
//       {/* ✅ NavBar já cuida do toggle global */}
//       <NavBar />

//       <main className="flex-1 p-8">
//         <section className="max-w-7xl mx-auto">
//           {/* Cabeçalho */}
//           <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//             <div>
//               <h2 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
//                 MEUS AGENDAMENTOS
//               </h2>
//               <p className={`text-md ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
//                 Visualize todos os eventos futuros agendados
//               </p>
//             </div>
//           </div>

//           {/* Barra de ações */}
//           <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => navigate("/event-history")}
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-gray-700 hover:bg-gray-600 text-white"
//                     : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
//                 }`}
//               >
//                 <History size={16} />
//                 Histórico
//               </button>
//               <button
//                 onClick={() => navigate("/schedule-event")}
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-gray-700 hover:bg-gray-600 text-white"
//                     : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
//                 }`}
//               >
//                 <Calendar size={16} />
//                 Eventos
//               </button>
//               <button
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-blue-600 hover:bg-blue-500 text-white"
//                     : "bg-blue-500 hover:bg-blue-600 text-white"
//                 }`}
//               >
//                 <GalleryVerticalEnd size={16} />
//                 Futuros
//               </button>
//               <button
//                 onClick={() => navigate("/shared-events")}
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-gray-700 hover:bg-gray-600 text-white"
//                     : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
//                 }`}
//               >
//                 <Share2 size={16} />
//                 Compartilhados
//               </button>
//             </div>

//             {/* Campo de busca */}
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <Search
//                   className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
//                     darkMode ? "text-gray-400" : "text-gray-500"
//                   }`}
//                   size={18}
//                 />
//                 <input
//                   type="text"
//                   placeholder="Buscar por destino, código ou status..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className={`pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
//                     darkMode
//                       ? "bg-[#0f172a] border-gray-600 text-gray-200"
//                       : "bg-white border-gray-300 text-gray-700"
//                   }`}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* EVENTOS FUTUROS */}
//           <div className="mb-6 flex items-center gap-2">
//             <CalendarDays
//               className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
//               size={22}
//             />
//             <h3
//               className={`text-lg font-semibold ${
//                 darkMode ? "text-blue-400" : "text-blue-600"
//               }`}
//             >
//               Eventos Futuros
//             </h3>
//           </div>

//           {/* Lista de cards */}
//           {loading ? (
//             <p className="text-center text-gray-400 italic mb-10">
//               Carregando eventos futuros...
//             </p>
//           ) : filteredFuture.length > 0 ? (
//             <div className="relative">
//               {showArrows(filteredFuture) && (
//                 <>
//                   <button
//                     onClick={() => scroll(futureRef, "left")}
//                     className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
//                       darkMode
//                         ? "bg-gray-700/80 hover:bg-gray-600"
//                         : "bg-white/80 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ChevronLeft size={18} />
//                   </button>
//                   <button
//                     onClick={() => scroll(futureRef, "right")}
//                     className={`absolute -right-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
//                       darkMode
//                         ? "bg-gray-700/80 hover:bg-gray-600"
//                         : "bg-white/80 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ChevronRight size={18} />
//                   </button>
//                 </>
//               )}

//               <div
//                 ref={futureRef}
//                 onScroll={() =>
//                   handleScroll(futureRef, setFutureFadeLeft, setFutureFadeRight)
//                 }
//                 className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
//               >
//                 {filteredFuture.map(renderCard)}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <CalendarDays
//                 className={`mx-auto mb-4 ${
//                   darkMode ? "text-gray-600" : "text-gray-400"
//                 }`}
//                 size={48}
//               />
//               <p
//                 className={`text-lg ${
//                   darkMode ? "text-gray-400" : "text-gray-500"
//                 }`}
//               >
//                 Nenhum evento futuro encontrado.
//               </p>
//               <p
//                 className={`text-sm ${
//                   darkMode ? "text-gray-500" : "text-gray-400"
//                 }`}
//               >
//                 Os eventos futuros aparecerão aqui automaticamente.
//               </p>
//             </div>
//           )}
//         </section>
//       </main>

//       <footer
//         className={`text-center py-4 text-sm ${
//           darkMode
//             ? "bg-gray-800 border-gray-600 text-gray-400"
//             : "bg-blue-50 border-gray-200 text-gray-500"
//         }`}
//       >
//         © {new Date().getFullYear()} MobiFácil. Todos os direitos reservados.
//       </footer>

//       {/* Modal de detalhes */}
//       {/* Exibição apenas (não pendente) usa o mesmo modal do histórico */}
//       <ScheduleEventDetailsModal
//         isOpen={isDetailsModalOpen && ((selectedEvent?.status_event || "").toLowerCase() !== "pending" && (selectedEvent?.status_event || "").toLowerCase() !== "pendente")}
//         onClose={handleCloseDetailsModal}
//         event={selectedEvent}
//         darkMode={darkMode}
//       />

//       {/* Edição somente quando pendente */}
//       <EventEditModal
//         isOpen={isDetailsModalOpen && ((selectedEvent?.status_event || "").toLowerCase() === "pending" || (selectedEvent?.status_event || "").toLowerCase() === "pendente")}
//         onClose={handleCloseDetailsModal}
//         event={selectedEvent}
//         darkMode={darkMode}
//         onUpdated={() => {
//           fetchFutureEvents();
//         }}
//       />

//       {/* Modal de Cancelamento */}
//       {showCancelModal && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
//             showCancelModal ? "opacity-100" : "opacity-0"
//           }`}
//         >
//           <div
//             className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-200 ${
//               showCancelModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
//             }`}
//           >
//             <button
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
//               onClick={() => setShowCancelModal(false)}
//             >
//               <XCircle size={20} />
//             </button>

//             <div className="text-center">

//               <h3 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
//                 <CircleAlert size={22} className="text-red-500 dark:text-red-400" /> Confirmar Cancelamento
//               </h3>
//               <p className="text-sm text-gray-600 dark:text-gray-300">
//                 Tem certeza que deseja cancelar este evento? Esta ação não pode ser desfeita.
//               </p>
//             </div>

//             <div className="mt-5 flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCancelModal(false)}
//                 className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
//               >
//                 Voltar
//               </button>
//               <button
//                 onClick={confirmCancelEvent}
//                 className={`px-4 py-2 rounded-md text-white transition shadow-md cursor-pointer ${darkMode ? "bg-red-400 hover:bg-red-600 text-gray-300" : "bg-red-500 hover:bg-red-600"}`}
//               >
//                 Confirmar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FutureEvents;