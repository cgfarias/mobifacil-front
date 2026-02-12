import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Clock,
  History,
  Calendar,
  GalleryVerticalEnd,
  Share2,
  CalendarSearch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
import NavBar from "../includes/NavBar";
import { useDarkMode } from "../../context/ThemeContext";
import api from "../../api/axios";

function SharedEvents() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [pastEvents, setPastEvents] = useState([]);
  const [futureEvents, setFutureEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);

  const lastEventElementRef = useCallback(
    (node) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore]
  );

  const handleOpenDetailsModal = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [datePart] = String(dateStr).split(" ");
    const [day, month, year] = (datePart || "").split("/");
    if (!day || !month || !year) return null;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const userIsPassenger = (event, userId) => {
    if (!event || !Array.isArray(event.passengers)) return false;
    const uid = parseInt(userId);
    return event.passengers.some((p) => {
      const pid = parseInt(p?.id ?? p?.user_id ?? p?.passenger_id);
      return !Number.isNaN(pid) && pid === uid;
    });
  };

  const fetchSharedEvents = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      else setLoading(true);

      const authRaw = localStorage.getItem("authData");
      let userId = null;
      if (authRaw) {
        try {
          const parsed = JSON.parse(authRaw);
          const user = parsed?.user_data || parsed;
          userId = user?.user_id ?? parsed?.user_id ?? null;
        } catch (_) {}
      }

      if (!userId) {
        console.warn("Usuário não identificado no localStorage.");
        if (isLoadMore) setIsLoadingMore(false);
        else setLoading(false);
        return;
      }

      const response = await api.get("/events/get");
      const events = response.data?.events || [];

      // 🔍 Depuração (ver quem será exibido)
      // console.groupCollapsed("🔎 Comparação de IDs (Depuração de eventos)");
      // events.forEach((e) => {
      //   const isPassenger = userIsPassenger(e, userId);
      //   const isRequester = parseInt(e?.user_id) === parseInt(userId);
      //   console.log({
      //     evento: e.code,
      //     solicitante_id: e.user_id,
      //     passageiros: e.passengers?.map(
      //       (p) => p?.user_id ?? p?.id ?? p?.passenger_id
      //     ),
      //     usuario_logado: userId,
      //     "é passageiro": isPassenger,
      //     "é solicitante": isRequester,
      //     "será exibido?": isPassenger && !isRequester,
      //   });
      // });
      // console.groupEnd();

      // Filtra eventos onde o usuário é passageiro, mas não solicitante
      const uid = parseInt(userId);
      const passengerEvents = events.filter(
        (e) => userIsPassenger(e, uid) && parseInt(e?.user_id) !== uid
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Divide entre passados e futuros
      const past = passengerEvents.filter((e) => parseDate(e.date_start) < today);
      const future = passengerEvents.filter(
        (e) => parseDate(e.date_start) >= today
      );

      // Ordenação
      past.sort((a, b) => parseDate(b.date_start) - parseDate(a.date_start));
      future.sort((a, b) => parseDate(a.date_start) - parseDate(b.date_start));

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;

      if (isLoadMore) {
        setPastEvents((prev) => [...prev, ...past.slice(startIndex, endIndex)]);
        setFutureEvents((prev) => [
          ...prev,
          ...future.slice(startIndex, endIndex),
        ]);
        setHasMore(endIndex < Math.max(past.length, future.length));
      } else {
        setPastEvents(past.slice(0, endIndex));
        setFutureEvents(future.slice(0, endIndex));
        setHasMore(endIndex < Math.max(past.length, future.length));
      }
    } catch (error) {
      console.error("❌ Erro ao buscar eventos compartilhados:", error);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedEvents();
  }, []);

  useEffect(() => {
    if (currentPage > 1) fetchSharedEvents(currentPage, true);
  }, [currentPage]);

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
        className={`w-full rounded-2xl p-5 mb-5 border border-b-4 ${bottomBorderColor} 
          ${darkMode ? "border-gray-600" : "border-gray-200"} 
          ${gradientClasses} transition-all hover:shadow-lg hover:-translate-y-[2px] cursor-pointer`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Status
            </span>
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
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Código
            </span>
            <p className="text-sm font-semibold text-[#2F95FF]">{event.code}</p>
          </div>
        </div>

        <div
          className={`border-t my-4 ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        />

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
      </div>
    );
  };

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

  const filteredPast = filterEvents(pastEvents);
  const filteredFuture = filterEvents(futureEvents);

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#1e293b] text-white" : "bg-blue-50 text-gray-800"
      }`}
    >
      <NavBar />

      <main className="flex-1 p-8">
        <section className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2
                className={`text-2xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                EVENTOS COMPARTILHADOS
              </h2>
              <p
                className={`text-md ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Visualize eventos onde você foi passageiro
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
                onClick={() => navigate("/future-events")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                <GalleryVerticalEnd size={16} />
                Futuros
              </button>
              <button
                onClick={() => navigate("/shared-events")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
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

          {/* Bloco FUTUROS */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <GalleryVerticalEnd
                className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
                size={22}
              />
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Eventos Futuros Compartilhados
              </h3>
            </div>
            {filteredFuture.length > 0 ? (
              <div
                className="grid gap-6"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                {filteredFuture.map(renderCard)}
              </div>
            ) : (
              <p className="text-center italic text-gray-400">
                Nenhum evento futuro encontrado.
              </p>
            )}
          </div>

          {/* Bloco PASSADOS */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <History
                className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
                size={22}
              />
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Eventos Passados Compartilhados
              </h3>
            </div>
            {loading ? (
              <p className="text-center text-gray-400 italic mb-10">
                Carregando histórico...
              </p>
            ) : filteredPast.length > 0 ? (
              <div
                className="grid gap-6"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                {filteredPast.map(renderCard)}
                {isLoadingMore && (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center italic text-gray-400">
                Nenhum evento passado encontrado.
              </p>
            )}
          </div>
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

      <ScheduleEventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        event={selectedEvent}
        darkMode={darkMode}
      />
    </div>
  );
}

// Animação simples
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeSlide {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-slide { animation: fadeSlide 0.6s ease-out forwards; }
`;
document.head.appendChild(style);

export default SharedEvents;