import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";   //  ✅ ADICIONE ESTA LINHA

import NavBar from "../includes/NavBar";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
import AssignModal from "../tableView/AssignModal";
import { useDarkMode } from "../../context/ThemeContext";
import api from "../../api/axios";
import { Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const DAY_START_MIN = 0 * 60; // 00:00
const DAY_END_MIN = 23 * 60; // 23:00
const MINUTES_PER_PIXEL = 2;
const POLL_INTERVAL_MS = 30_000;

const STATUS_STYLES = {
  approved: { bg: "bg-emerald-400", text: "text-white" },
  "pre approved": { bg: "bg-emerald-500", text: "text-white" },
  pending: { bg: "bg-orange-300", text: "text-white" },
  canceled: { bg: "bg-gray-400", text: "text-white" },
  denied: { bg: "bg-red-400", text: "text-white" },
  default: { bg: "bg-slate-400", text: "text-white" },
};

const styleForStatus = (status) =>
  STATUS_STYLES[(status || "").toLowerCase()] || STATUS_STYLES.default;

const parseBrDateTime = (str) => {
  if (!str) return null;
  const [datePart, timePart] = str.split(" ");
  if (!datePart || !timePart) return null;
  const [dd, mm, yyyy] = datePart.split("/").map((v) => parseInt(v, 10));
  const [HH, MM] = timePart.split(":").map((v) => parseInt(v, 10));
  return new Date(yyyy, mm - 1, dd, HH, MM, 0, 0);
};

const isSameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function computeLayout(eventsForDay) {

  // console.log("---- LAYOUT INPUT ----", eventsForDay.length);


  const items = eventsForDay
    .map((e, idx) => {
      const ds = parseBrDateTime(e.date_start);
      const de = parseBrDateTime(e.date_end) || ds;
      const startMin = Math.max(DAY_START_MIN, ds.getHours() * 60 + ds.getMinutes());
      const endMinRaw = Math.max(startMin + 15, de.getHours() * 60 + de.getMinutes());
      const endMin = Math.min(DAY_END_MIN, endMinRaw);
      return { ...e, _idx: idx, _start: startMin, _end: endMin };
    })
    .filter((e) => e._end > DAY_START_MIN && e._start < DAY_END_MIN)
    .sort((a, b) => a._start - b._start || a._end - b._end);

  const clusters = [];
  let current = [];
  let currentEnd = -1;

  for (const ev of items) {
    if (current.length === 0) {
      current.push(ev);
      currentEnd = ev._end;
    } else if (ev._start < currentEnd) {
      current.push(ev);
      currentEnd = Math.max(currentEnd, ev._end);
    } else {
      clusters.push(current);
      current = [ev];
      currentEnd = ev._end;
    }
  }
  if (current.length) clusters.push(current);

  const laid = [];
  for (const cluster of clusters) {
    const cols = [];
    const placement = [];

    for (const ev of cluster) {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (ev._start >= cols[c]) {
          placement.push(c);
          cols[c] = ev._end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        placement.push(cols.length);
        cols.push(ev._end);
      }
    }

    const totalCols = cols.length;
    cluster.forEach((ev, i) => {
      const col = placement[i];
      const topPx = (Math.max(DAY_START_MIN, ev._start) - DAY_START_MIN) / MINUTES_PER_PIXEL;
      const heightPx = Math.max(
        20,
        ((Math.min(DAY_END_MIN, ev._end) - Math.max(DAY_START_MIN, ev._start)) /
          MINUTES_PER_PIXEL) - 1
      );
      const widthPct = 100 / totalCols;
      const leftPct = col * widthPct;

      laid.push({
        ...ev,
        _top: topPx,
        _height: heightPx,
        _left: leftPct,
        _width: widthPct - 0.5,
      });
    });
  }

  
  // console.log("---- LAYOUT OUTPUT ----", laid.length);


  return laid;
}

export default function DailyCalendar() {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const gridRef = useRef(null);

  // Adiciona keyframes para pulsar os cards (escuro -> claro -> escuro)
  useEffect(() => {
    const styleId = "daily-calendar-pulse-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
@keyframes pulseShade { 0% { filter: brightness(1); } 50% { filter: brightness(1.15); } 100% { filter: brightness(1); } }
.pulse-card { animation: pulseShade 1.6s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }, []);


  const goPrev = () =>
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goNext = () =>
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
  };

  // const fetchEvents = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     const authData = JSON.parse(localStorage.getItem("authData"));
  //     const userId = authData?.user_id;
  //     const { data } = await api.get("/events/get");
  //     let all = data?.events || [];
  //     if (userId) all = all.filter((e) => e.user_id === userId);
  //     setEvents(all);
  //   } catch (e) {
  //     console.error("Erro ao buscar eventos:", e);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  const fetchAllEventsFromAPI = async () => {
    const allEvents = [];
    let currentPage = 1;
  
    try {
      while (true) {
        const response = await api.get(`/events/get?page=${currentPage}`);
  
        const events = response.data?.events || [];
  
        if (events.length === 0) break;
  
        allEvents.push(...events);
        currentPage++;
      }
  
      return allEvents;
  
    } catch (error) {
      console.error("Erro ao buscar páginas:", error);
      return [];
    }
  };
  


  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
  
      // carrega todas as páginas, igual ao EventHistory
      const all = await fetchAllEventsFromAPI();
  
      // console.log("TOTAL EVENTOS CARREGADOS PARA O CALENDÁRIO:", all.length);
  
      setEvents(all);
  
    } catch (e) {
      console.error("Erro ao buscar eventos:", e);
    } finally {
      setLoading(false);
    }
  }, []);
  
  
  


  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(fetchEvents, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) fetchEvents();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchEvents);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchEvents);
    };
  }, [fetchEvents]);

  // CODE NOVO 
  // useEffect(() => {
  //   if (!events || events.length === 0) return;
  
  //   const eventsForSelectedDate = events.filter((ev) =>
  //     isSameYMD(new Date(ev.date_start), selectedDate)
  //   );
  
  //   console.log("=== EVENTOS DO DIA ===");
  //   console.log("Data:", selectedDate.toISOString().slice(0, 10));
  //   console.log("Total real:", eventsForSelectedDate.length);
  //   console.log("Lista:", eventsForSelectedDate);
  //   console.log("======================");
  // }, [events, selectedDate]);
  


  const handleAssignClick = (event) => {
    setCurrentPreset({
      ...event,
      solicitante: event.user_id,
      setorOrigem: event.destiny?.name || "Não informado",
      destino: event.destiny?.destiny_type || "Não definido",
      veiculoIda: event.vehicle_start || "",
      veiculoRetorno: event.vehicle_end || "",
      motoristaIda: "",
      motoristaRetorno: "",
      whatsappIda: "",
      whatsappRetorno: "",
    });
    setOpenAssign(true);
    setIsDetailsOpen(false);
  };

  const handleAssignClose = () => {
    setOpenAssign(false);
    setCurrentPreset(null);
  };

  const handleAssignSubmit = () => {
    handleAssignClose();
    fetchEvents();
  };

  const handleEventClick = (event) => {
    if ((event.status_event || "").toLowerCase() === "pending") {
      handleAssignClick(event);
      return;
    }

    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  // const eventsForDay = useMemo(() => {
  //   return events.filter((e) => {
  //     const start = parseBrDateTime(e.date_start);
  //     return start && isSameYMD(start, selectedDate);
  //   });
  // }, [events, selectedDate]);

  // CODE NOVO
  // const eventsForDay = useMemo(() => {
  //   const sel = dayjs(selectedDate);

  //   console.log("=== DEBUG EVENTOS ===");
  //   console.log("Data atual selecionada:", sel.format("YYYY-MM-DD"));
  
  //   if (!events || !Array.isArray(events)) {
  //     console.warn("⚠ 'events' não é um array!", events);
  //   } else {
  //     console.log(`Total de eventos recebidos: ${events.length}`);
  //   }
  
  //   // events.forEach((ev, idx) => {
  //   //   const start = parseBrDateTime(ev.date_start);
  
  //   //   const parsed = start
  //   //     ? dayjs(start).format("YYYY-MM-DD HH:mm:ss")
  //   //     : "DATA INVÁLIDA";
  
  //   //   const match = start
  //   //     ? isSameYMD(start, selectedDate)
  //   //     : false;
  
  //   //   console.log(`Evento[${idx}] =>`, {
  //   //     id: ev.id,
  //   //     titulo: ev.title || ev.nome || "sem título",
  //   //     date_start: ev.date_start,
  //   //     parsed,
  //   //     bate_com_o_dia: match
  //   //   });
  
  //   //   if (!match) {
  //   //     console.warn("❌ DESCARTADO:", ev);
  //   //   }
  //   // });
  
  //   const filtered = events.filter((ev) => {
  //     const start = parseBrDateTime(ev.date_start);
  //     return start && isSameYMD(start, selectedDate);
  //   });
  
  //   console.log("=== RESUMO FINAL ===");
  //   console.log("Eventos válidos para o dia:", filtered.length);
  //   console.log("Lista final:", filtered);
  //   console.log("=====================");
  
  //   return filtered;
  // }, [events, selectedDate]);

  const eventsForDay = useMemo(() => {
        return events.filter((e) => {
          const start = parseBrDateTime(e.date_start);
          return start && isSameYMD(start, selectedDate);
        });
      }, [events, selectedDate]);
  
  
  

  


  const laidOut = useMemo(() => computeLayout(eventsForDay), [eventsForDay]);
  const totalHeight = (DAY_END_MIN - DAY_START_MIN) / MINUTES_PER_PIXEL;

  const dayLabel = selectedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const weekdayLabel = selectedDate.toLocaleDateString("pt-BR", { weekday: "long" });
  const isToday = isSameYMD(selectedDate, new Date());
  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    let current = new Date(first);
    current.setDate(current.getDate() - first.getDay());
    while (current <= last || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const monthDays = useMemo(() => getDaysInMonth(selectedDate), [selectedDate]);

  // Mapeia eventos por data (para pontinhos no mini calendário)
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const d = parseBrDateTime(ev.date_start);
      if (!d) return;
      const key = d.toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div
        className={`flex flex-col flex-1 ${darkMode
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
            : "bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 text-gray-900"
          }`}
      >
        <NavBar darkMode={darkMode} />

        {/* HEADER */}
        <div
          className={`shadow-lg ${darkMode
              ? "bg-slate-800 border-b border-slate-700"
              : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white"
            }`}
        >
          <div className="mx-auto px-6 py-3 flex justify-between items-center flex-wrap gap-3">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className={`p-2 rounded ${darkMode
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-blue-600/40 hover:bg-blue-600/60"
                  } transition`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={goToday}
                className={`px-4 py-1.5 text-sm rounded font-semibold ${darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  } transition`}
              >
                hoje
              </button>
              <button
                onClick={goNext}
                className={`p-2 rounded ${darkMode
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-blue-600/40 hover:bg-blue-600/60"
                  } transition`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Data + Mini calendário */}
            <div
              className="relative text-center flex-1 cursor-pointer select-none"
              onClick={() => setCalendarVisible((v) => !v)}
            >
              <h1 className="text-lg font-bold">{dayLabel}</h1>
              {calendarVisible && (
                <div
                  className={`absolute mt-2 right-1/2 translate-x-1/2 p-4 rounded-lg shadow-lg ${darkMode ? "bg-slate-700" : "bg-white text-gray-800"
                    } border ${darkMode ? "border-slate-600" : "border-gray-200"
                    } z-50`}
                >
                  <div className="text-sm font-semibold mb-2 text-center capitalize">
                    {selectedDate.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="grid grid-cols-7 text-xs text-center gap-1">
                    {daysOfWeek.map((d, i) => (
                      <div key={d + i} className="font-bold opacity-70">
                        {d}
                      </div>
                    ))}
                    {/* {daysOfWeek.map((d) => (
                      <div key={d} className="font-bold opacity-70">
                        {d}
                      </div>
                    ))} */}
                    {monthDays.map((day) => {
                      const active = isSameYMD(day, selectedDate);
                      const today = isSameYMD(day, new Date());
                      const key = day.toISOString().split("T")[0];
                      const hasEvent = eventsByDate[key];
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => {
                            setSelectedDate(new Date(day));
                            setCalendarVisible(false);
                          }}
                          className={`relative p-1.5 rounded transition ${active
                              ? "bg-blue-600 text-white"
                              : today
                                ? "border border-blue-500"
                                : "hover:bg-blue-100"
                            }`}
                        >
                          {day.getDate()}
                          {hasEvent && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CALENDÁRIO */}
        <div className="max-auto p-4 flex-1 overflow-auto">
          <div
            className={`rounded-lg overflow-hidden shadow-md ${darkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
              }`}
          >
            <div className="border-b border-slate-300">
              <div
                className={`text-center py-3 font-semibold capitalize ${darkMode ? "text-blue-400" : "text-blue-700"
                  }`}
              >
                {weekdayLabel}
              </div>
            </div>

            {/* GRADE E EVENTOS INTEGRADOS */}
            <div className="relative">
              {/* Linha do tempo atual */}
              {isToday && (() => {
                const now = new Date();
                const mins = now.getHours() * 60 + now.getMinutes();
                if (mins >= DAY_START_MIN && mins <= DAY_END_MIN) {
                  const top = (mins - DAY_START_MIN) / MINUTES_PER_PIXEL;
                  return (
                    <div
                      className="absolute left-0 right-0 z-20"
                      style={{ top }}
                    >
                      {/* <div className="h-0.5 bg-red-500 w-full relative">
                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                      </div> */}
                    </div>
                  );
                }
              })()}

              {/* Lista de horários (00:00 → 23:00) e área de eventos */}
              <div
                ref={gridRef}
                className={`relative ${darkMode ? "bg-slate-800" : "bg-white"
                  } overflow-hidden`}
                style={{
                  height: `${totalHeight}px`,
                  backgroundImage: darkMode
                    ? "repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(71,85,105,0.3) 30px)"
                    : "repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(148,163,184,0.15) 30px)",
                }}
              >
                {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }).map((_, i) => {
                  const hour = Math.floor(DAY_START_MIN / 60) + i;
                  const label = `${String(hour).padStart(2, "0")}:00`;
                  const hourTop = (hour * 60 - DAY_START_MIN) / MINUTES_PER_PIXEL;
                  return (
                    <div
                      key={i}
                      className={`absolute left-0 right-0 ${darkMode ? "border-slate-700" : "border-slate-200"
                        } border-b pointer-events-none`}
                      style={{ height: `${60 / MINUTES_PER_PIXEL}px`, top: `${hourTop}px` }}
                    >
                      <span
                        className={`absolute -top-2 left-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}

                {/* Eventos em camada única sobre a grade */}
                {(!loading && laidOut.length > 0) && (
                  <div className="absolute inset-0">
                    {laidOut.map((ev) => {
                      const s = styleForStatus(ev.status_event);
                      return (
                        <button
                          key={ev.id}
                          onClick={() => handleEventClick(ev)}
                          // className={`absolute rounded ${s.bg} ${s.text} shadow-sm cursor-pointer hover:shadow-lg hover:z-10 transition-all pulse-card backdrop-blur-md ring-1 ring-white/10`}
                          className={`absolute rounded ${s.bg} ${s.text} shadow-sm cursor-pointer hover:shadow-lg hover:z-10 transition-all pulse-card backdrop-blur-md ring-1 ring-white/10 ${
                            darkMode ? "border-2 border-gray-700" : "border-2 border-blue-200"
                          }`}
                          
                          style={{
                            top: ev._top,
                            // height: ev._height,
                            height: 90,
                            left: `${ev._left}%`,
                            width: `${ev._width}%`,
                            padding: "4px 6px",
                            animationDelay: `${(ev._idx % 4) * 0.2}s`,
                          }}
                        >
                          {/* <div className="text-[11px] font-semibold leading-tight truncate mt-0.5">
                            {ev.code || "Sem código"}
                          </div> */}
                          {ev.destiny?.name && (
                            <div className="text-[13px] font-bold opacity-90 leading-tight truncate">
                              {ev.destiny.name}
                            </div>
                          )}
                          <div className="text-[12px] leading-tight truncate">
                            {ev.date_start?.slice(-5)} - {ev.date_end?.slice(-5)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Estados de loading e vazio */}
                {loading && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                  >
                    Carregando eventos…
                  </div>
                )}
                {!loading && laidOut.length === 0 && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center italic ${darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                  >
                    Nenhum evento neste dia.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />

        <AssignModal
          isOpen={openAssign}
          onClose={handleAssignClose}
          onSubmit={handleAssignSubmit}
          preset={currentPreset || {}}
          eventId={currentPreset?.id}
          onRefresh={fetchEvents}
          events={events}
        />

        {/* Modal de detalhes */}
        <ScheduleEventDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          event={selectedEvent}
          darkMode={darkMode}
          allowEdit={(() => {
            const status = (selectedEvent?.status_event || "").toLowerCase();
            const isApproved = status === "approved" || status === "aprovado";
            const role = (user?.role || "").toLowerCase();
            const isPrivileged = role === "admin" || role === "moderator";
            return Boolean(isApproved && isPrivileged);
          })()}
          allowEditApproved={true}
          allowTransportEdit={true}
        />
      </div>
    </div>
  );
}































































// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import NavBar from "../includes/NavBar";
// import Sidebar from "../includes/Sidebar";
// import Footer from "../includes/Footer";
// import ScheduleEventDetailsModal from "./ScheduleEventDetailsModal";
// import AssignModal from "../tableView/AssignModal";
// import { useDarkMode } from "../../context/ThemeContext";
// import api from "../../api/axios";
// import { Calendar } from "lucide-react";
// import { useAuth } from "../../context/AuthContext";

// const DAY_START_MIN = 0 * 60; // 00:00
// const DAY_END_MIN = 23 * 60; // 23:00
// const MINUTES_PER_PIXEL = 2;
// const POLL_INTERVAL_MS = 30_000;

// const STATUS_STYLES = {
//   approved: { bg: "bg-emerald-400", text: "text-white" },
//   "pre approved": { bg: "bg-emerald-500", text: "text-white" },
//   pending: { bg: "bg-orange-300", text: "text-white" },
//   canceled: { bg: "bg-gray-400", text: "text-white" },
//   denied: { bg: "bg-red-400", text: "text-white" },
//   default: { bg: "bg-slate-400", text: "text-white" },
// };

// const styleForStatus = (status) =>
//   STATUS_STYLES[(status || "").toLowerCase()] || STATUS_STYLES.default;

// const parseBrDateTime = (str) => {
//   if (!str) return null;
//   const [datePart, timePart] = str.split(" ");
//   if (!datePart || !timePart) return null;
//   const [dd, mm, yyyy] = datePart.split("/").map((v) => parseInt(v, 10));
//   const [HH, MM] = timePart.split(":").map((v) => parseInt(v, 10));
//   return new Date(yyyy, mm - 1, dd, HH, MM, 0, 0);
// };

// const isSameYMD = (a, b) =>
//   a.getFullYear() === b.getFullYear() &&
//   a.getMonth() === b.getMonth() &&
//   a.getDate() === b.getDate();

// function computeLayout(eventsForDay) {
//   const items = eventsForDay
//     .map((e, idx) => {
//       const ds = parseBrDateTime(e.date_start);
//       const de = parseBrDateTime(e.date_end) || ds;
//       const startMin = Math.max(DAY_START_MIN, ds.getHours() * 60 + ds.getMinutes());
//       const endMinRaw = Math.max(startMin + 15, de.getHours() * 60 + de.getMinutes());
//       const endMin = Math.min(DAY_END_MIN, endMinRaw);
//       return { ...e, _idx: idx, _start: startMin, _end: endMin };
//     })
//     .filter((e) => e._end > DAY_START_MIN && e._start < DAY_END_MIN)
//     .sort((a, b) => a._start - b._start || a._end - b._end);

//   const clusters = [];
//   let current = [];
//   let currentEnd = -1;

//   for (const ev of items) {
//     if (current.length === 0) {
//       current.push(ev);
//       currentEnd = ev._end;
//     } else if (ev._start < currentEnd) {
//       current.push(ev);
//       currentEnd = Math.max(currentEnd, ev._end);
//     } else {
//       clusters.push(current);
//       current = [ev];
//       currentEnd = ev._end;
//     }
//   }
//   if (current.length) clusters.push(current);

//   const laid = [];
//   for (const cluster of clusters) {
//     const cols = [];
//     const placement = [];

//     for (const ev of cluster) {
//       let placed = false;
//       for (let c = 0; c < cols.length; c++) {
//         if (ev._start >= cols[c]) {
//           placement.push(c);
//           cols[c] = ev._end;
//           placed = true;
//           break;
//         }
//       }
//       if (!placed) {
//         placement.push(cols.length);
//         cols.push(ev._end);
//       }
//     }

//     const totalCols = cols.length;
//     cluster.forEach((ev, i) => {
//       const col = placement[i];
//       const topPx = (Math.max(DAY_START_MIN, ev._start) - DAY_START_MIN) / MINUTES_PER_PIXEL;
//       const heightPx = Math.max(
//         20,
//         ((Math.min(DAY_END_MIN, ev._end) - Math.max(DAY_START_MIN, ev._start)) /
//           MINUTES_PER_PIXEL) - 1
//       );
//       const widthPct = 100 / totalCols;
//       const leftPct = col * widthPct;

//       laid.push({
//         ...ev,
//         _top: topPx,
//         _height: heightPx,
//         _left: leftPct,
//         _width: widthPct - 0.5,
//       });
//     });
//   }

//   return laid;
// }

// export default function DailyCalendar() {
//   const { darkMode } = useDarkMode();
//   const { user } = useAuth();
//   const [selectedDate, setSelectedDate] = useState(() => {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     return d;
//   });
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isDetailsOpen, setIsDetailsOpen] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [calendarVisible, setCalendarVisible] = useState(false);
//   const [openAssign, setOpenAssign] = useState(false);
//   const [currentPreset, setCurrentPreset] = useState(null);
//   const gridRef = useRef(null);

//   // Adiciona keyframes para pulsar os cards (escuro -> claro -> escuro)
//   useEffect(() => {
//     const styleId = "daily-calendar-pulse-style";
//     if (document.getElementById(styleId)) return;
//     const style = document.createElement("style");
//     style.id = styleId;
//     style.innerHTML = `
// @keyframes pulseShade { 0% { filter: brightness(1); } 50% { filter: brightness(1.15); } 100% { filter: brightness(1); } }
// .pulse-card { animation: pulseShade 1.6s ease-in-out infinite; }
//     `;
//     document.head.appendChild(style);
//   }, []);


//   const goPrev = () =>
//     setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
//   const goNext = () =>
//     setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
//   const goToday = () => {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     setSelectedDate(d);
//   };

//   // const fetchEvents = useCallback(async () => {
//   //   try {
//   //     setLoading(true);
//   //     const authData = JSON.parse(localStorage.getItem("authData"));
//   //     const userId = authData?.user_id;
//   //     const { data } = await api.get("/events/get");
//   //     let all = data?.events || [];
//   //     if (userId) all = all.filter((e) => e.user_id === userId);
//   //     setEvents(all);
//   //   } catch (e) {
//   //     console.error("Erro ao buscar eventos:", e);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, []);

//   const fetchEvents = useCallback(async () => {
//     try {
//       setLoading(true);
//       const { data } = await api.get("/events/get");
//       const all = data?.events || [];
//       setEvents(all);
//     } catch (e) {
//       console.error("Erro ao buscar eventos:", e);
//     } finally {
//       setLoading(false);
//     }
//   }, []);
  


//   useEffect(() => {
//     fetchEvents();
//   }, [fetchEvents]);

//   useEffect(() => {
//     const interval = setInterval(fetchEvents, POLL_INTERVAL_MS);
//     const handleVisibility = () => {
//       if (!document.hidden) fetchEvents();
//     };

//     document.addEventListener('visibilitychange', handleVisibility);
//     window.addEventListener('focus', fetchEvents);

//     return () => {
//       clearInterval(interval);
//       document.removeEventListener('visibilitychange', handleVisibility);
//       window.removeEventListener('focus', fetchEvents);
//     };
//   }, [fetchEvents]);

//   // CODE NOVO 
//   useEffect(() => {
//     if (!events || events.length === 0) return;
  
//     const eventsForSelectedDate = events.filter((ev) =>
//       isSameYMD(new Date(ev.date_start), selectedDate)
//     );
  
//     console.log("=== EVENTOS DO DIA ===");
//     console.log("Data:", selectedDate.toISOString().slice(0, 10));
//     console.log("Total real:", eventsForSelectedDate.length);
//     console.log("Lista:", eventsForSelectedDate);
//     console.log("======================");
//   }, [events, selectedDate]);
  


//   const handleAssignClick = (event) => {
//     setCurrentPreset({
//       ...event,
//       solicitante: event.user_id,
//       setorOrigem: event.destiny?.name || "Não informado",
//       destino: event.destiny?.destiny_type || "Não definido",
//       veiculoIda: event.vehicle_start || "",
//       veiculoRetorno: event.vehicle_end || "",
//       motoristaIda: "",
//       motoristaRetorno: "",
//       whatsappIda: "",
//       whatsappRetorno: "",
//     });
//     setOpenAssign(true);
//     setIsDetailsOpen(false);
//   };

//   const handleAssignClose = () => {
//     setOpenAssign(false);
//     setCurrentPreset(null);
//   };

//   const handleAssignSubmit = () => {
//     handleAssignClose();
//     fetchEvents();
//   };

//   const handleEventClick = (event) => {
//     if ((event.status_event || "").toLowerCase() === "pending") {
//       handleAssignClick(event);
//       return;
//     }

//     setSelectedEvent(event);
//     setIsDetailsOpen(true);
//   };

//   const eventsForDay = useMemo(() => {
//     return events.filter((e) => {
//       const start = parseBrDateTime(e.date_start);
//       return start && isSameYMD(start, selectedDate);
//     });
//   }, [events, selectedDate]);

//   const laidOut = useMemo(() => computeLayout(eventsForDay), [eventsForDay]);
//   const totalHeight = (DAY_END_MIN - DAY_START_MIN) / MINUTES_PER_PIXEL;

//   const dayLabel = selectedDate.toLocaleDateString("pt-BR", {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//   });
//   const weekdayLabel = selectedDate.toLocaleDateString("pt-BR", { weekday: "long" });
//   const isToday = isSameYMD(selectedDate, new Date());
//   const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

//   const getDaysInMonth = (date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const first = new Date(year, month, 1);
//     const last = new Date(year, month + 1, 0);
//     const days = [];
//     let current = new Date(first);
//     current.setDate(current.getDate() - first.getDay());
//     while (current <= last || current.getDay() !== 0) {
//       days.push(new Date(current));
//       current.setDate(current.getDate() + 1);
//     }
//     return days;
//   };

//   const monthDays = useMemo(() => getDaysInMonth(selectedDate), [selectedDate]);

//   // Mapeia eventos por data (para pontinhos no mini calendário)
//   const eventsByDate = useMemo(() => {
//     const map = {};
//     events.forEach((ev) => {
//       const d = parseBrDateTime(ev.date_start);
//       if (!d) return;
//       const key = d.toISOString().split("T")[0];
//       if (!map[key]) map[key] = [];
//       map[key].push(ev);
//     });
//     return map;
//   }, [events]);

//   return (
//     <div className="flex min-h-screen">
//       <Sidebar />

//       <div
//         className={`flex flex-col flex-1 ${darkMode
//             ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
//             : "bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 text-gray-900"
//           }`}
//       >
//         <NavBar darkMode={darkMode} />

//         {/* HEADER */}
//         <div
//           className={`shadow-lg ${darkMode
//               ? "bg-slate-800 border-b border-slate-700"
//               : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white"
//             }`}
//         >
//           <div className="mx-auto px-6 py-3 flex justify-between items-center flex-wrap gap-3">
//             {/* Navegação */}
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={goPrev}
//                 className={`p-2 rounded ${darkMode
//                     ? "bg-slate-700 hover:bg-slate-600"
//                     : "bg-blue-600/40 hover:bg-blue-600/60"
//                   } transition`}
//               >
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M15 19l-7-7 7-7"
//                   />
//                 </svg>
//               </button>
//               <button
//                 onClick={goToday}
//                 className={`px-4 py-1.5 text-sm rounded font-semibold ${darkMode
//                     ? "bg-slate-700 hover:bg-slate-600 text-white"
//                     : "bg-blue-600 hover:bg-blue-700 text-white"
//                   } transition`}
//               >
//                 hoje
//               </button>
//               <button
//                 onClick={goNext}
//                 className={`p-2 rounded ${darkMode
//                     ? "bg-slate-700 hover:bg-slate-600"
//                     : "bg-blue-600/40 hover:bg-blue-600/60"
//                   } transition`}
//               >
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 5l7 7-7 7"
//                   />
//                 </svg>
//               </button>
//             </div>

//             {/* Data + Mini calendário */}
//             <div
//               className="relative text-center flex-1 cursor-pointer select-none"
//               onClick={() => setCalendarVisible((v) => !v)}
//             >
//               <h1 className="text-lg font-bold">{dayLabel}</h1>
//               {calendarVisible && (
//                 <div
//                   className={`absolute mt-2 right-1/2 translate-x-1/2 p-4 rounded-lg shadow-lg ${darkMode ? "bg-slate-700" : "bg-white text-gray-800"
//                     } border ${darkMode ? "border-slate-600" : "border-gray-200"
//                     } z-50`}
//                 >
//                   <div className="text-sm font-semibold mb-2 text-center capitalize">
//                     {selectedDate.toLocaleDateString("pt-BR", {
//                       month: "long",
//                       year: "numeric",
//                     })}
//                   </div>
//                   <div className="grid grid-cols-7 text-xs text-center gap-1">
//                     {daysOfWeek.map((d, i) => (
//                       <div key={d + i} className="font-bold opacity-70">
//                         {d}
//                       </div>
//                     ))}
//                     {/* {daysOfWeek.map((d) => (
//                       <div key={d} className="font-bold opacity-70">
//                         {d}
//                       </div>
//                     ))} */}
//                     {monthDays.map((day) => {
//                       const active = isSameYMD(day, selectedDate);
//                       const today = isSameYMD(day, new Date());
//                       const key = day.toISOString().split("T")[0];
//                       const hasEvent = eventsByDate[key];
//                       return (
//                         <button
//                           key={day.toISOString()}
//                           onClick={() => {
//                             setSelectedDate(new Date(day));
//                             setCalendarVisible(false);
//                           }}
//                           className={`relative p-1.5 rounded transition ${active
//                               ? "bg-blue-600 text-white"
//                               : today
//                                 ? "border border-blue-500"
//                                 : "hover:bg-blue-100"
//                             }`}
//                         >
//                           {day.getDate()}
//                           {hasEvent && (
//                             <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
//                           )}
//                         </button>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* CALENDÁRIO */}
//         <div className="max-auto p-4 flex-1 overflow-auto">
//           <div
//             className={`rounded-lg overflow-hidden shadow-md ${darkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
//               }`}
//           >
//             <div className="border-b border-slate-300">
//               <div
//                 className={`text-center py-3 font-semibold capitalize ${darkMode ? "text-blue-400" : "text-blue-700"
//                   }`}
//               >
//                 {weekdayLabel}
//               </div>
//             </div>

//             {/* GRADE E EVENTOS INTEGRADOS */}
//             <div className="relative">
//               {/* Linha do tempo atual */}
//               {isToday && (() => {
//                 const now = new Date();
//                 const mins = now.getHours() * 60 + now.getMinutes();
//                 if (mins >= DAY_START_MIN && mins <= DAY_END_MIN) {
//                   const top = (mins - DAY_START_MIN) / MINUTES_PER_PIXEL;
//                   return (
//                     <div
//                       className="absolute left-0 right-0 z-20"
//                       style={{ top }}
//                     >
//                       {/* <div className="h-0.5 bg-red-500 w-full relative">
//                         <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
//                       </div> */}
//                     </div>
//                   );
//                 }
//               })()}

//               {/* Lista de horários (00:00 → 23:00) e área de eventos */}
//               <div
//                 ref={gridRef}
//                 className={`relative ${darkMode ? "bg-slate-800" : "bg-white"
//                   } overflow-hidden`}
//                 style={{
//                   height: `${totalHeight}px`,
//                   backgroundImage: darkMode
//                     ? "repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(71,85,105,0.3) 30px)"
//                     : "repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(148,163,184,0.15) 30px)",
//                 }}
//               >
//                 {Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }).map((_, i) => {
//                   const hour = Math.floor(DAY_START_MIN / 60) + i;
//                   const label = `${String(hour).padStart(2, "0")}:00`;
//                   const hourTop = (hour * 60 - DAY_START_MIN) / MINUTES_PER_PIXEL;
//                   return (
//                     <div
//                       key={i}
//                       className={`absolute left-0 right-0 ${darkMode ? "border-slate-700" : "border-slate-200"
//                         } border-b pointer-events-none`}
//                       style={{ height: `${60 / MINUTES_PER_PIXEL}px`, top: `${hourTop}px` }}
//                     >
//                       <span
//                         className={`absolute -top-2 left-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"
//                           }`}
//                       >
//                         {label}
//                       </span>
//                     </div>
//                   );
//                 })}

//                 {/* Eventos em camada única sobre a grade */}
//                 {(!loading && laidOut.length > 0) && (
//                   <div className="absolute inset-0">
//                     {laidOut.map((ev) => {
//                       const s = styleForStatus(ev.status_event);
//                       return (
//                         <button
//                           key={ev.id}
//                           onClick={() => handleEventClick(ev)}
//                           // className={`absolute rounded ${s.bg} ${s.text} shadow-sm cursor-pointer hover:shadow-lg hover:z-10 transition-all pulse-card backdrop-blur-md ring-1 ring-white/10`}
//                           className={`absolute rounded ${s.bg} ${s.text} shadow-sm cursor-pointer hover:shadow-lg hover:z-10 transition-all pulse-card backdrop-blur-md ring-1 ring-white/10 ${
//                             darkMode ? "border-2 border-gray-700" : "border-2 border-blue-200"
//                           }`}
                          
//                           style={{
//                             top: ev._top,
//                             // height: ev._height,
//                             height: 90,
//                             left: `${ev._left}%`,
//                             width: `${ev._width}%`,
//                             padding: "4px 6px",
//                             animationDelay: `${(ev._idx % 4) * 0.2}s`,
//                           }}
//                         >
//                           {/* <div className="text-[11px] font-semibold leading-tight truncate mt-0.5">
//                             {ev.code || "Sem código"}
//                           </div> */}
//                           {ev.destiny?.name && (
//                             <div className="text-[13px] font-bold opacity-90 leading-tight truncate">
//                               {ev.destiny.name}
//                             </div>
//                           )}
//                           <div className="text-[12px] leading-tight truncate">
//                             {ev.date_start?.slice(-5)} - {ev.date_end?.slice(-5)}
//                           </div>
//                         </button>
//                       );
//                     })}
//                   </div>
//                 )}

//                 {/* Estados de loading e vazio */}
//                 {loading && (
//                   <div
//                     className={`absolute inset-0 flex items-center justify-center ${darkMode ? "text-slate-400" : "text-slate-500"
//                       }`}
//                   >
//                     Carregando eventos…
//                   </div>
//                 )}
//                 {!loading && laidOut.length === 0 && (
//                   <div
//                     className={`absolute inset-0 flex items-center justify-center italic ${darkMode ? "text-slate-400" : "text-slate-500"
//                       }`}
//                   >
//                     Nenhum evento neste dia.
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         <Footer />

//         <AssignModal
//           isOpen={openAssign}
//           onClose={handleAssignClose}
//           onSubmit={handleAssignSubmit}
//           preset={currentPreset || {}}
//           eventId={currentPreset?.id}
//           onRefresh={fetchEvents}
//           events={events}
//         />

//         {/* Modal de detalhes */}
//         <ScheduleEventDetailsModal
//           isOpen={isDetailsOpen}
//           onClose={() => setIsDetailsOpen(false)}
//           event={selectedEvent}
//           darkMode={darkMode}
//           allowEdit={(() => {
//             const status = (selectedEvent?.status_event || "").toLowerCase();
//             const isApproved = status === "approved" || status === "aprovado";
//             const role = (user?.role || "").toLowerCase();
//             const isPrivileged = role === "admin" || role === "moderator";
//             return Boolean(isApproved && isPrivileged);
//           })()}
//           allowEditApproved={true}
//           allowTransportEdit={true}
//         />
//       </div>
//     </div>
//   );
// }