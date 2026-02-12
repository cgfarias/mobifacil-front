import { useState, useRef, useEffect } from "react";
import {
  Search,
  CalendarDays,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  History,
  Calendar,
  GalleryVerticalEnd,
  Share2,
  XCircle,
  CircleAlert,
  Info,
  CalendarSearch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScheduleEventModal from "./ScheduleEventModal";
import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
import EventEditModal from "./EventEditModal";
import NavBar from "../includes/NavBar";
import api from "../../api/axios";
import { useDarkMode } from "../../context/ThemeContext";

function ScheduleEvent() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [todayEvents, setTodayEvents] = useState([]);
  const [tomorrowEvents, setTomorrowEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Estados de modais
  const [cancelEventId, setCancelEventId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  // ✅ Modal automático de boas-vindas/informativo (abre apenas uma vez por sessão)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const todayRef = useRef(null);
  const tomorrowRef = useRef(null);

  const [todayFadeLeft, setTodayFadeLeft] = useState(false);
  const [todayFadeRight, setTodayFadeRight] = useState(true);
  const [tomorrowFadeLeft, setTomorrowFadeLeft] = useState(false);
  const [tomorrowFadeRight, setTomorrowFadeRight] = useState(true);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenDetailsModal = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  // ✅ Atualiza evento
  // Edição movida para EventEditModal (centraliza formatação e PUT)
  

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEventCreated = () => {
    fetchEvents();
    setTimeout(() => {
      setIsModalOpen(false);
      triggerToast("Evento criado com sucesso!");
    }, 400);
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

  // ✅ Buscar eventos
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("authData"));
      const userId = authData?.user_id;
      if (!userId) {
        console.warn("Usuário não identificado.");
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
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);

      const isSameDay = (a, b) =>
        a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

      setTodayEvents(userEvents.filter((e) => isSameDay(parseDate(e.date_start), today)));
      setTomorrowEvents(userEvents.filter((e) => isSameDay(parseDate(e.date_start), tomorrow)));
    } catch (error) {
      console.error("❌ Erro ao buscar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Atualização automática a cada 1 minuto (mesmo permanecendo na tela)
  const prevEventsRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const authData = JSON.parse(localStorage.getItem("authData"));
        const userId = authData?.user_id;

        // 🔄 AGORA BUSCA TODAS AS PÁGINAS
        const events = await fetchAllEventsFromAPI();

        // Filtra apenas os eventos do usuário logado
        const userEvents = userId
          ? events.filter((e) => e.user_id === userId)
          : events;

        // 🔎 Compara com os eventos anteriores
        const prevEvents = prevEventsRef.current;
        if (JSON.stringify(prevEvents) !== JSON.stringify(userEvents)) {
          console.log("🔄 Atualização detectada! Recarregando eventos...");
          prevEventsRef.current = userEvents;
          fetchEvents();
          triggerToast("Eventos atualizados automaticamente!");
        }
      } catch (err) {
        console.warn("⚠️ Erro ao verificar atualizações automáticas:", err);
      }
    }, 60000); // ⏱️ 1 minuto = 60.000ms

    return () => clearInterval(interval);
  }, []);

  

  useEffect(() => {
    const hasSeenModal = localStorage.getItem("welcomeModalSeen");
    if (!hasSeenModal) {
      // Mostra o modal após um pequeno delay
      setTimeout(() => setShowWelcomeModal(true), 600);
    }
  }, []);
  
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("welcomeModalSeen", "true");
  };


  // ✅ Filtro de busca
  const filterEvents = (events) => {
    const term = searchTerm.toLowerCase();
    const translateStatus = (s) => {
      switch (s?.toLowerCase()) {
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
      const t = translateStatus(e.status_event);
      return (
        e.destiny?.name?.toLowerCase().includes(term) ||
        e.code?.toLowerCase().includes(term) ||
        e.status_event?.toLowerCase().includes(term) ||
        t.includes(term)
      );
    });
  };

  const filteredToday = filterEvents(todayEvents);
  const filteredTomorrow = filterEvents(tomorrowEvents);

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
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

  const translateStatus = (s) => {
    switch (s?.toLowerCase()) {
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

  const openCancelModal = (id) => {
    setCancelEventId(id);
    setShowCancelModal(true);
  };

  const confirmCancelEvent = async () => {
    if (!cancelEventId) return;
    try {
      await api.put(`/events/${cancelEventId}/cancel`);
      triggerToast("Evento cancelado com sucesso!");
      fetchEvents();
    } catch {
      triggerToast("Erro ao cancelar evento. Tente novamente.");
    } finally {
      setShowCancelModal(false);
      setCancelEventId(null);
    }
  };

  // ✅ Render cards
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
              className={`mt-1 px-3 py-1 text-xs font-semibold rounded-full w-fit border ${
                darkMode
                  ? color === "green"
                    ? "bg-green-600/25 text-green-300 border-green-400/30"
                    : color === "yellow"
                    ? "bg-yellow-500/25 text-yellow-300 border-yellow-400/30"
                    : color === "gray"
                    ? "bg-gray-600/25 text-gray-300 border-gray-400/30"
                    : "bg-red-600/25 text-red-300 border-red-400/30"
                  : color === "green"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : color === "yellow"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                  : color === "gray"
                  ? "bg-gray-100 text-gray-700 border-gray-300"
                  : "bg-red-100 text-red-700 border-red-300"
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
            <XCircle size={16} />
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
      <NavBar onBellClick={() => setShowInfoModal(true)} />


      {/* ✅ Modal automático ao logar (abre uma vez por sessão) */}
      {showWelcomeModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showWelcomeModal ? "opacity-100" : "opacity-0"
            }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-3xl p-10 relative transform transition-all duration-500 ease-out
        ${showWelcomeModal ? "animate-fadeSlideUp" : "opacity-0 scale-95"}
      `}
          >
            {/* Botão Fechar */}
            <button
              onClick={handleCloseWelcomeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <XCircle size={22} />
            </button>

            {/* Título */}
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-8 text-blue-600 dark:text-blue-400">
              🚗 Comunicado – Solicitação de Veículos
            </h2>

            {/* Conteúdo */}
            <div className="text-base leading-relaxed text-gray-700 dark:text-gray-200 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              <p>
                A Diretoria Administrativa informa que, em relação às solicitações de veículos,{" "}
                <strong>
                  a saída e o retorno com os funcionários devem ser feitos na CEHAB, dentro do horário de expediente.
                </strong>
              </p>

              <p>
                Em situações específicas, como saídas antes do expediente ou retornos após o término, poderão ser abertas
                exceções, desde que o ponto de embarque ou desembarque esteja localizado na rota da demanda.
              </p>

              <p>Contamos com a compreensão e colaboração de todos.</p>

              <p className="pt-4 text-center font-semibold text-gray-800 dark:text-gray-300">
                CEHAB – DIRETORIA ADMINISTRATIVA
              </p>
            </div>
          </div>

          {/* ✨ Keyframes da animação */}
          <style>{`
      @keyframes fadeSlideUp {
        0% {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        60% {
          opacity: 1;
          transform: translateY(-5px) scale(1.02);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-fadeSlideUp {
        animation: fadeSlideUp 0.5s ease-out forwards;
      }
    `}</style>
        </div>
      )}



      {/* ✅ Modal de COMUNICADOS */}
      {showInfoModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showInfoModal ? "opacity-100" : "opacity-0"
            }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-3xl p-10 relative transform transition-all duration-500 ease-out
        ${showInfoModal ? "animate-fadeSlideUp" : "opacity-0 scale-95"}
      `}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <XCircle size={22} />
            </button>

            {/* Título */}
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-8 text-red-500 dark:text-red-400">
              ⚠️🚗 COMUNICADO – SOLICITAÇÃO E USO DE VEÍCULOS
            </h2>

            {/* Conteúdo */}
            <div className="text-base leading-relaxed text-gray-700 dark:text-gray-200 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              <p>
                <strong>Prazo de solicitação –</strong> As requisições de veículos deverão ser encaminhadas até às{" "}
                <strong>12h (meio-dia)</strong> do dia anterior à data da viagem. Solicitações feitas após esse horário
                não serão atendidas.
              </p>

              <p>
                <strong>Tolerância para embarque –</strong> O tempo máximo de espera do motorista será de{" "}
                <strong>30 minutos</strong> a partir do horário agendado. Ultrapassado esse período, o veículo será
                liberado para outra demanda.
              </p>

              <p>
                <strong>Compromisso com a organização –</strong> O cumprimento desses prazos é fundamental para garantir
                o melhor aproveitamento da frota, possibilitando o atendimento a todos os setores de forma ágil e
                organizada.
              </p>

              <p>
                <strong>Responsabilidade dos solicitantes –</strong> Pedimos atenção redobrada quanto à programação de
                horários e deslocamentos. Alterações ou cancelamentos devem ser informados com antecedência.
              </p>

              <p>
                <strong>Reforçamos</strong> que essas medidas visam otimizar os recursos da instituição, garantindo
                maior eficiência na utilização dos veículos oficiais e atendendo de maneira justa às diversas demandas
                da CEHAB.
              </p>

              <p className="pt-4 text-center font-semibold text-gray-800 dark:text-gray-300">
                CEHAB – DIRETORIA ADMINISTRATIVA
              </p>
            </div>
          </div>

          {/* ✨ Keyframes da animação */}
          <style>{`
            @keyframes fadeSlideUp {
              0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
              }
              60% {
                opacity: 1;
                transform: translateY(-5px) scale(1.02);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-fadeSlideUp {
              animation: fadeSlideUp 0.5s ease-out forwards;
            }
          `}
          </style>
        </div>
      )}


      {/* ✅ Modal de CANCELAMENTO */}
      {showCancelModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            showCancelModal ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-300 ${
              showCancelModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowCancelModal(false)}
            >
              <XCircle size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
              <CircleAlert size={22} className="text-red-500 dark:text-red-400" />
              Confirmar Cancelamento
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Tem certeza que deseja{" "}
              <span className="font-medium text-red-500 dark:text-red-400">CANCELAR</span> este evento?
              <br />
              Esta ação <strong>não poderá ser desfeita.</strong>
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Voltar
              </button>

              <button
                onClick={confirmCancelEvent}
                className={`px-4 py-2 rounded-md text-white transition shadow-md ${
                  darkMode ? "bg-red-400 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Cabeçalho com botão Comunicados */}
      <main className="flex-1 p-8">
        <section className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2
                className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-800"
                  }`}
              >
                MEUS AGENDAMENTOS
              </h2>
              <p
                className={`text-md ${darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Crie e gerencie os agendamentos da frota em tempo real
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
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

              <button
                onClick={handleOpenModal}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all cursor-pointer ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                + Novo Evento
              </button>
            </div>
          </div>

          {/* HOJE */}
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
              Hoje
            </h3>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 italic mb-10">
              Carregando eventos...
            </p>
          ) : filteredToday.length > 0 ? (
            <div className="relative">
              {showArrows(filteredToday) && (
                <>
                  <button
                    onClick={() => scroll(todayRef, "left")}
                    className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
                      darkMode
                        ? "bg-gray-700/80 hover:bg-gray-600"
                        : "bg-white/80 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll(todayRef, "right")}
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
                ref={todayRef}
                onScroll={() =>
                  handleScroll(todayRef, setTodayFadeLeft, setTodayFadeRight)
                }
                className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
              >
                {filteredToday.map(renderCard)}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 italic mb-10">
              Nenhum evento encontrado para hoje.
            </p>
          )}

          {/* AMANHÃ */}
          <div className="mt-12 mb-6 flex items-center gap-2">
            <CalendarDays
              className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
              size={22}
            />
            <h3
              className={`text-lg font-semibold ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Amanhã
            </h3>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 italic mb-10">
              Carregando eventos...
            </p>
          ) : filteredTomorrow.length > 0 ? (
            <div className="relative">
              {showArrows(filteredTomorrow) && (
                <>
                  <button
                    onClick={() => scroll(tomorrowRef, "left")}
                    className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
                      darkMode
                        ? "bg-gray-700/80 hover:bg-gray-600"
                        : "bg-white/80 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll(tomorrowRef, "right")}
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
                ref={tomorrowRef}
                onScroll={() =>
                  handleScroll(
                    tomorrowRef,
                    setTomorrowFadeLeft,
                    setTomorrowFadeRight
                  )
                }
                className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
              >
                {filteredTomorrow.map(renderCard)}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 italic">
              Nenhum evento encontrado para amanhã.
            </p>
          )}
        </section>
      </main>

      {/* Rodapé */}
      <footer
        className={`text-center py-4 text-sm ${
          darkMode
            ? "bg-gray-800 border-gray-600 text-gray-400"
            : "bg-blue-50 border-gray-200 text-gray-500"
        }`}
      >
        © {new Date().getFullYear()} MobiFácil. Todos os direitos reservados.
      </footer>

      {/* ✅ Toast estilizado */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
            toastMessage.includes("erro") || toastMessage.includes("Erro")
              ? darkMode
                ? "bg-red-700 text-white"
                : "bg-red-500 text-white"
              : darkMode
              ? "bg-green-700 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {toastMessage.includes("erro") || toastMessage.includes("Erro") ? (
            <XCircle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}
          {toastMessage}
        </div>
      )}

      {/* Modais */}
      <ScheduleEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleEventCreated}
        darkMode={darkMode}
      />

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
          fetchEvents();
          triggerToast("Evento atualizado com sucesso!");
        }}
      />
    </div>
  );
}

export default ScheduleEvent;











































































// import { useState, useRef, useEffect } from "react";
// import {
//   Search,
//   CalendarDays,
//   MapPin,
//   Clock,
//   ChevronLeft,
//   ChevronRight,
//   CheckCircle,
//   History,
//   Calendar,
//   GalleryVerticalEnd,
//   Share2,
//   XCircle,
//   CircleAlert,
//   Info,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import ScheduleEventModal from "./ScheduleEventModal";
// import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
// import EventEditModal from "./EventEditModal";
// import NavBar from "../includes/NavBar";
// import api from "../../api/axios";
// import { useDarkMode } from "../../context/ThemeContext";

// function ScheduleEvent() {
//   const navigate = useNavigate();
//   const { darkMode } = useDarkMode();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [showToast, setShowToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const [todayEvents, setTodayEvents] = useState([]);
//   const [tomorrowEvents, setTomorrowEvents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ✅ Estados de modais
//   const [cancelEventId, setCancelEventId] = useState(null);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [showInfoModal, setShowInfoModal] = useState(false);
//   // ✅ Modal automático de boas-vindas/informativo (abre apenas uma vez por sessão)
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   const todayRef = useRef(null);
//   const tomorrowRef = useRef(null);

//   const [todayFadeLeft, setTodayFadeLeft] = useState(false);
//   const [todayFadeRight, setTodayFadeRight] = useState(true);
//   const [tomorrowFadeLeft, setTomorrowFadeLeft] = useState(false);
//   const [tomorrowFadeRight, setTomorrowFadeRight] = useState(true);

//   const handleOpenModal = () => setIsModalOpen(true);
//   const handleCloseModal = () => setIsModalOpen(false);

//   const handleOpenDetailsModal = (event) => {
//     setSelectedEvent(event);
//     setIsDetailsModalOpen(true);
//   };

//   const handleCloseDetailsModal = () => {
//     setIsDetailsModalOpen(false);
//     setSelectedEvent(null);
//   };

//   // ✅ Atualiza evento
//   // Edição movida para EventEditModal (centraliza formatação e PUT)
  

//   const triggerToast = (message) => {
//     setToastMessage(message);
//     setShowToast(true);
//     setTimeout(() => setShowToast(false), 3000);
//   };

//   const handleEventCreated = () => {
//     fetchEvents();
//     setTimeout(() => {
//       setIsModalOpen(false);
//       triggerToast("Evento criado com sucesso!");
//     }, 400);
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

//   // ✅ Buscar eventos
//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
//       const authData = JSON.parse(localStorage.getItem("authData"));
//       const userId = authData?.user_id;
//       if (!userId) {
//         console.warn("Usuário não identificado.");
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
//       const tomorrow = new Date();
//       tomorrow.setDate(today.getDate() + 1);
//       today.setHours(0, 0, 0, 0);
//       tomorrow.setHours(0, 0, 0, 0);

//       const isSameDay = (a, b) =>
//         a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

//       setTodayEvents(userEvents.filter((e) => isSameDay(parseDate(e.date_start), today)));
//       setTomorrowEvents(userEvents.filter((e) => isSameDay(parseDate(e.date_start), tomorrow)));
//     } catch (error) {
//       console.error("❌ Erro ao buscar eventos:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   // ✅ Atualização automática a cada 1 minuto (mesmo permanecendo na tela)
//   const prevEventsRef = useRef([]);

//   useEffect(() => {
//     const interval = setInterval(async () => {
//       try {
//         const response = await api.get("/events/get");
//         const authData = JSON.parse(localStorage.getItem("authData"));
//         const userId = authData?.user_id;
//         const events = response.data?.events || [];

//         // Filtra apenas os eventos do usuário logado
//         const userEvents = userId
//           ? events.filter((e) => e.user_id === userId)
//           : events;

//         // 🔎 Compara com os eventos anteriores
//         const prevEvents = prevEventsRef.current;
//         if (JSON.stringify(prevEvents) !== JSON.stringify(userEvents)) {
//           console.log("🔄 Atualização detectada! Recarregando eventos...");
//           prevEventsRef.current = userEvents;
//           fetchEvents();
//           triggerToast("Eventos atualizados automaticamente!");
//         }
//       } catch (err) {
//         console.warn("⚠️ Erro ao verificar atualizações automáticas:", err);
//       }
//     }, 60000); // ⏱️ 1 minuto = 60.000ms

//     return () => clearInterval(interval);
//   }, []);

  

//   useEffect(() => {
//     const hasSeenModal = localStorage.getItem("welcomeModalSeen");
//     if (!hasSeenModal) {
//       // Mostra o modal após um pequeno delay
//       setTimeout(() => setShowWelcomeModal(true), 600);
//     }
//   }, []);
  
//   const handleCloseWelcomeModal = () => {
//     setShowWelcomeModal(false);
//     localStorage.setItem("welcomeModalSeen", "true");
//   };


//   // ✅ Filtro de busca
//   const filterEvents = (events) => {
//     const term = searchTerm.toLowerCase();
//     const translateStatus = (s) => {
//       switch (s?.toLowerCase()) {
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
//       const t = translateStatus(e.status_event);
//       return (
//         e.destiny?.name?.toLowerCase().includes(term) ||
//         e.code?.toLowerCase().includes(term) ||
//         e.status_event?.toLowerCase().includes(term) ||
//         t.includes(term)
//       );
//     });
//   };

//   const filteredToday = filterEvents(todayEvents);
//   const filteredTomorrow = filterEvents(tomorrowEvents);

//   const getStatusColor = (s) => {
//     switch (s?.toLowerCase()) {
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

//   const translateStatus = (s) => {
//     switch (s?.toLowerCase()) {
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

//   const openCancelModal = (id) => {
//     setCancelEventId(id);
//     setShowCancelModal(true);
//   };

//   const confirmCancelEvent = async () => {
//     if (!cancelEventId) return;
//     try {
//       await api.put(`/events/${cancelEventId}/cancel`);
//       triggerToast("Evento cancelado com sucesso!");
//       fetchEvents();
//     } catch {
//       triggerToast("Erro ao cancelar evento. Tente novamente.");
//     } finally {
//       setShowCancelModal(false);
//       setCancelEventId(null);
//     }
//   };

//   // ✅ Render cards
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
//               className={`mt-1 px-3 py-1 text-xs font-semibold rounded-full w-fit border ${
//                 darkMode
//                   ? color === "green"
//                     ? "bg-green-600/25 text-green-300 border-green-400/30"
//                     : color === "yellow"
//                     ? "bg-yellow-500/25 text-yellow-300 border-yellow-400/30"
//                     : color === "gray"
//                     ? "bg-gray-600/25 text-gray-300 border-gray-400/30"
//                     : "bg-red-600/25 text-red-300 border-red-400/30"
//                   : color === "green"
//                   ? "bg-green-100 text-green-700 border-green-300"
//                   : color === "yellow"
//                   ? "bg-yellow-100 text-yellow-700 border-yellow-300"
//                   : color === "gray"
//                   ? "bg-gray-100 text-gray-700 border-gray-300"
//                   : "bg-red-100 text-red-700 border-red-300"
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
//             <XCircle size={16} />
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
//       <NavBar onBellClick={() => setShowInfoModal(true)} />


//       {/* ✅ Modal automático ao logar (abre uma vez por sessão) */}
//       {showWelcomeModal && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showWelcomeModal ? "opacity-100" : "opacity-0"
//             }`}
//         >
//           <div
//             className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-3xl p-10 relative transform transition-all duration-500 ease-out
//         ${showWelcomeModal ? "animate-fadeSlideUp" : "opacity-0 scale-95"}
//       `}
//           >
//             {/* Botão Fechar */}
//             <button
//               onClick={handleCloseWelcomeModal}
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
//             >
//               <XCircle size={22} />
//             </button>

//             {/* Título */}
//             <h2 className="text-2xl font-bold flex items-center gap-3 mb-8 text-blue-600 dark:text-blue-400">
//               🚗 Comunicado – Solicitação de Veículos
//             </h2>

//             {/* Conteúdo */}
//             <div className="text-base leading-relaxed text-gray-700 dark:text-gray-200 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
//               <p>
//                 A Diretoria Administrativa informa que, em relação às solicitações de veículos,{" "}
//                 <strong>
//                   a saída e o retorno com os funcionários devem ser feitos na CEHAB, dentro do horário de expediente.
//                 </strong>
//               </p>

//               <p>
//                 Em situações específicas, como saídas antes do expediente ou retornos após o término, poderão ser abertas
//                 exceções, desde que o ponto de embarque ou desembarque esteja localizado na rota da demanda.
//               </p>

//               <p>Contamos com a compreensão e colaboração de todos.</p>

//               <p className="pt-4 text-center font-semibold text-gray-800 dark:text-gray-300">
//                 CEHAB – DIRETORIA ADMINISTRATIVA
//               </p>
//             </div>
//           </div>

//           {/* ✨ Keyframes da animação */}
//           <style>{`
//       @keyframes fadeSlideUp {
//         0% {
//           opacity: 0;
//           transform: translateY(30px) scale(0.95);
//         }
//         60% {
//           opacity: 1;
//           transform: translateY(-5px) scale(1.02);
//         }
//         100% {
//           opacity: 1;
//           transform: translateY(0) scale(1);
//         }
//       }
//       .animate-fadeSlideUp {
//         animation: fadeSlideUp 0.5s ease-out forwards;
//       }
//     `}</style>
//         </div>
//       )}



//       {/* ✅ Modal de COMUNICADOS */}
//       {showInfoModal && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showInfoModal ? "opacity-100" : "opacity-0"
//             }`}
//         >
//           <div
//             className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-3xl p-10 relative transform transition-all duration-500 ease-out
//         ${showInfoModal ? "animate-fadeSlideUp" : "opacity-0 scale-95"}
//       `}
//           >
//             {/* Botão Fechar */}
//             <button
//               onClick={() => setShowInfoModal(false)}
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
//             >
//               <XCircle size={22} />
//             </button>

//             {/* Título */}
//             <h2 className="text-2xl font-bold flex items-center gap-3 mb-8 text-red-500 dark:text-red-400">
//               ⚠️🚗 COMUNICADO – SOLICITAÇÃO E USO DE VEÍCULOS
//             </h2>

//             {/* Conteúdo */}
//             <div className="text-base leading-relaxed text-gray-700 dark:text-gray-200 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
//               <p>
//                 <strong>Prazo de solicitação –</strong> As requisições de veículos deverão ser encaminhadas até às{" "}
//                 <strong>12h (meio-dia)</strong> do dia anterior à data da viagem. Solicitações feitas após esse horário
//                 não serão atendidas.
//               </p>

//               <p>
//                 <strong>Tolerância para embarque –</strong> O tempo máximo de espera do motorista será de{" "}
//                 <strong>30 minutos</strong> a partir do horário agendado. Ultrapassado esse período, o veículo será
//                 liberado para outra demanda.
//               </p>

//               <p>
//                 <strong>Compromisso com a organização –</strong> O cumprimento desses prazos é fundamental para garantir
//                 o melhor aproveitamento da frota, possibilitando o atendimento a todos os setores de forma ágil e
//                 organizada.
//               </p>

//               <p>
//                 <strong>Responsabilidade dos solicitantes –</strong> Pedimos atenção redobrada quanto à programação de
//                 horários e deslocamentos. Alterações ou cancelamentos devem ser informados com antecedência.
//               </p>

//               <p>
//                 <strong>Reforçamos</strong> que essas medidas visam otimizar os recursos da instituição, garantindo
//                 maior eficiência na utilização dos veículos oficiais e atendendo de maneira justa às diversas demandas
//                 da CEHAB.
//               </p>

//               <p className="pt-4 text-center font-semibold text-gray-800 dark:text-gray-300">
//                 CEHAB – DIRETORIA ADMINISTRATIVA
//               </p>
//             </div>
//           </div>

//           {/* ✨ Keyframes da animação */}
//           <style>{`
//             @keyframes fadeSlideUp {
//               0% {
//                 opacity: 0;
//                 transform: translateY(30px) scale(0.95);
//               }
//               60% {
//                 opacity: 1;
//                 transform: translateY(-5px) scale(1.02);
//               }
//               100% {
//                 opacity: 1;
//                 transform: translateY(0) scale(1);
//               }
//             }
//             .animate-fadeSlideUp {
//               animation: fadeSlideUp 0.5s ease-out forwards;
//             }
//           `}
//           </style>
//         </div>
//       )}


//       {/* ✅ Modal de CANCELAMENTO */}
//       {showCancelModal && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
//             showCancelModal ? "opacity-100" : "opacity-0"
//           }`}
//         >
//           <div
//             className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-300 ${
//               showCancelModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
//             }`}
//           >
//             <button
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
//               onClick={() => setShowCancelModal(false)}
//             >
//               <XCircle size={20} />
//             </button>

//             <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
//               <CircleAlert size={22} className="text-red-500 dark:text-red-400" />
//               Confirmar Cancelamento
//             </h2>

//             <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
//               Tem certeza que deseja{" "}
//               <span className="font-medium text-red-500 dark:text-red-400">CANCELAR</span> este evento?
//               <br />
//               Esta ação <strong>não poderá ser desfeita.</strong>
//             </p>

//             <div className="flex justify-end gap-3 mt-2">
//               <button
//                 onClick={() => setShowCancelModal(false)}
//                 className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
//               >
//                 Voltar
//               </button>

//               <button
//                 onClick={confirmCancelEvent}
//                 className={`px-4 py-2 rounded-md text-white transition shadow-md ${
//                   darkMode ? "bg-red-400 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"
//                 }`}
//               >
//                 Confirmar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ Cabeçalho com botão Comunicados */}
//       <main className="flex-1 p-8">
//         <section className="max-w-7xl mx-auto">
//           {/* Cabeçalho */}
//           <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
//             <div>
//               <h2
//                 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-gray-800"
//                   }`}
//               >
//                 MEUS AGENDAMENTOS
//               </h2>
//               <p
//                 className={`text-md ${darkMode ? "text-gray-400" : "text-gray-500"
//                   }`}
//               >
//                 Crie e gerencie os agendamentos da frota em tempo real
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
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-blue-600 hover:bg-blue-500 text-white"
//                     : "bg-blue-500 hover:bg-blue-600 text-white"
//                 }`}
//               >
//                 <Calendar size={16} />
//                 Eventos
//               </button>
//               <button
//                 onClick={() => navigate("/future-events")}
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
//                   darkMode
//                     ? "bg-gray-700 hover:bg-gray-600 text-white"
//                     : "bg-white hover:bg-gray-200 text-gray-700 border border-gray-300"
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

//               <button
//                 onClick={handleOpenModal}
//                 className={`px-4 py-2 rounded-md font-medium text-sm transition-all cursor-pointer ${
//                   darkMode
//                     ? "bg-blue-600 hover:bg-blue-500 text-white"
//                     : "bg-blue-500 hover:bg-blue-600 text-white"
//                 }`}
//               >
//                 + Novo Evento
//               </button>
//             </div>
//           </div>

//           {/* HOJE */}
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
//               Hoje
//             </h3>
//           </div>

//           {loading ? (
//             <p className="text-center text-gray-400 italic mb-10">
//               Carregando eventos...
//             </p>
//           ) : filteredToday.length > 0 ? (
//             <div className="relative">
//               {showArrows(filteredToday) && (
//                 <>
//                   <button
//                     onClick={() => scroll(todayRef, "left")}
//                     className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
//                       darkMode
//                         ? "bg-gray-700/80 hover:bg-gray-600"
//                         : "bg-white/80 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ChevronLeft size={18} />
//                   </button>
//                   <button
//                     onClick={() => scroll(todayRef, "right")}
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
//                 ref={todayRef}
//                 onScroll={() =>
//                   handleScroll(todayRef, setTodayFadeLeft, setTodayFadeRight)
//                 }
//                 className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
//               >
//                 {filteredToday.map(renderCard)}
//               </div>
//             </div>
//           ) : (
//             <p className="text-center text-gray-400 italic mb-10">
//               Nenhum evento encontrado para hoje.
//             </p>
//           )}

//           {/* AMANHÃ */}
//           <div className="mt-12 mb-6 flex items-center gap-2">
//             <CalendarDays
//               className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}
//               size={22}
//             />
//             <h3
//               className={`text-lg font-semibold ${
//                 darkMode ? "text-blue-400" : "text-blue-600"
//               }`}
//             >
//               Amanhã
//             </h3>
//           </div>

//           {loading ? (
//             <p className="text-center text-gray-400 italic mb-10">
//               Carregando eventos...
//             </p>
//           ) : filteredTomorrow.length > 0 ? (
//             <div className="relative">
//               {showArrows(filteredTomorrow) && (
//                 <>
//                   <button
//                     onClick={() => scroll(tomorrowRef, "left")}
//                     className={`absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-md ${
//                       darkMode
//                         ? "bg-gray-700/80 hover:bg-gray-600"
//                         : "bg-white/80 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ChevronLeft size={18} />
//                   </button>
//                   <button
//                     onClick={() => scroll(tomorrowRef, "right")}
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
//                 ref={tomorrowRef}
//                 onScroll={() =>
//                   handleScroll(
//                     tomorrowRef,
//                     setTomorrowFadeLeft,
//                     setTomorrowFadeRight
//                   )
//                 }
//                 className="flex gap-6 overflow-x-hidden scroll-smooth scrollbar-none snap-x snap-mandatory pb-4"
//               >
//                 {filteredTomorrow.map(renderCard)}
//               </div>
//             </div>
//           ) : (
//             <p className="text-center text-gray-400 italic">
//               Nenhum evento encontrado para amanhã.
//             </p>
//           )}
//         </section>
//       </main>

//       {/* Rodapé */}
//       <footer
//         className={`text-center py-4 text-sm ${
//           darkMode
//             ? "bg-gray-800 border-gray-600 text-gray-400"
//             : "bg-blue-50 border-gray-200 text-gray-500"
//         }`}
//       >
//         © {new Date().getFullYear()} MobiFácil. Todos os direitos reservados.
//       </footer>

//       {/* ✅ Toast estilizado */}
//       {showToast && (
//         <div
//           className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
//             toastMessage.includes("erro") || toastMessage.includes("Erro")
//               ? darkMode
//                 ? "bg-red-700 text-white"
//                 : "bg-red-500 text-white"
//               : darkMode
//               ? "bg-green-700 text-white"
//               : "bg-green-500 text-white"
//           }`}
//         >
//           {toastMessage.includes("erro") || toastMessage.includes("Erro") ? (
//             <XCircle size={18} />
//           ) : (
//             <CheckCircle size={18} />
//           )}
//           {toastMessage}
//         </div>
//       )}

//       {/* Modais */}
//       <ScheduleEventModal
//         isOpen={isModalOpen}
//         onClose={handleCloseModal}
//         onSubmit={handleEventCreated}
//         darkMode={darkMode}
//       />

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
//           fetchEvents();
//           triggerToast("Evento atualizado com sucesso!");
//         }}
//       />
//     </div>
//   );
// }

// export default ScheduleEvent;