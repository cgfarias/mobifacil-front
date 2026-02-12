import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import NavBar from "../includes/NavBar";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import StatisticCard from '../statisticCard/StatisticCard';
import { Car, ClipboardList, Wrench, CheckCircle, Clock, Ban } from 'lucide-react';
import api from '../../api/axios';
import HomeTableView from "../tableView/HomeTableView";

function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 Autenticação
  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) navigate('/login');
  }, [navigate]);

  // 🧠 Mantém referência do estado anterior para comparar mudanças
  const prevEventsRef = useRef([]);

  const fetchEvents = async () => {
    try {
      let page = 1;
      const limit = 50;
      let allEvents = [];
      let hasMore = true;
  
      while (hasMore) {
        const res = await api.get(`/events/get-pending?page=${page}&limit=${limit}`);
        
        if (res.status === 200) {
          const pageEvents = res.data.events || [];
  
          allEvents = [...allEvents, ...pageEvents];
  
          // console.log(`📄 Página ${page} carregada:`, pageEvents.length);
  
          if (pageEvents.length < limit) {
            hasMore = false; // Não há mais páginas
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
  
      // console.log("✔ Total carregado:", allEvents.length);
      return allEvents;
  
    } catch (err) {
      console.error("❌ Erro ao buscar eventos:", err);
      return [];
    }
  };
  

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicle/get");
      if (res.status === 200) return res.data.vehicle_data;
    } catch (err) {
      console.error("❌ Erro ao buscar veículos:", err);
    }
    return [];
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/driver/get");
      if (res.status === 200) return res.data.driver_data;
    } catch (err) {
      console.error("❌ Erro ao buscar motoristas:", err);
    }
    return [];
  };

  // === Carregar dados iniciais ===
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [eventsData, vehiclesData, driversData] = await Promise.all([
        fetchEvents(),
        fetchVehicles(),
        fetchDrivers(),
      ]);
      setEvents(eventsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      prevEventsRef.current = eventsData;
      setLoading(false);
    };
    loadData();
  }, []);

  // === Atualiza evento específico após PUT ===
  const updateEvent = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
    );
  };

  // === Atualização automática a cada 10s ===
  useEffect(() => {
    const interval = setInterval(async () => {
      const newEvents = await fetchEvents();

      // Evita atualizar se nada mudou
      const prevEvents = prevEventsRef.current;
      if (JSON.stringify(newEvents) !== JSON.stringify(prevEvents)) {
        setEvents(newEvents);
        prevEventsRef.current = newEvents;
        console.log("🔄 Lista de eventos atualizada automaticamente");
      }
    }, 10000); // <-- 10 segundos

    return () => clearInterval(interval);
  }, []);

  // === Funções auxiliares ===
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

  // === Eventos do dia (independente de status) ===
  const todayEvents = events.filter((event) => isToday(event.date_start));

  // === Contagens por status (somente do dia atual) ===
  // const totalPending = events.filter(
  //   (e) => isToday(e.date_start) && e.status_event === "pending"
  // ).length;
  const totalPending = events.filter(
    (e) => e.status_event === "pending"
  ).length;
  

  const totalApproved = events.filter(
    (e) =>
      isToday(e.date_start) &&
      ["approved", "pre approved"].includes(e.status_event)
  ).length;

  const totalDenied = events.filter(
    (e) => isToday(e.date_start) && e.status_event === "denied"
  ).length;


  // === Cards estatísticos ===
  const stats = [
    {
      title: "Frota Atual",
      value: vehicles.length,
      icon: <Car className="w-6 h-6 text-blue-300" />,
    },
    {
      title: "Motoristas",
      value: drivers.length,
      icon: <CheckCircle className="w-6 h-6 text-blue-300" />,
    },
    // {
    //   title: "Eventos do Dia",
    //   value: todayEvents.length,
    //   icon: <ClipboardList className="w-6 h-6 text-blue-300" />,
    // },
    {
      title: "Eventos Pendentes",
      value: totalPending,
      icon: <Clock className="w-6 h-6 text-blue-300" />,
    },
    // {
    //   title: "Aprovados",
    //   value: totalApproved,
    //   icon: <CheckCircle className="w-6 h-6 text-green-400" />,
    // },
    // {
    //   title: "Negados",
    //   value: totalDenied,
    //   icon: <Ban className="w-6 h-6 text-red-400" />,
    // },
    {
      title: "Veículos em Manutenção",
      value: "0",
      icon: <Wrench className="w-6 h-6 text-blue-300" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-blue-50 dark:bg-gray-800">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <NavBar />
        <main className="flex flex-col flex-1">
          {/* === Cards === */}
          <section className="flex flex-wrap gap-6 items-center justify-center dark:bg-gray-700 bg-blue-50 py-6 pb-4">
            {stats.map((stat, idx) => (
              <StatisticCard
                key={idx}
                {...stat}
                bgGradient="bg-blue-100 dark:bg-gray-700"
              />
            ))}
          </section>

          {/* === Tabela === */}
          <section className="flex-1 flex items-start justify-center dark:bg-gray-700 bg-blue-50 px-6 pb-10">
            {loading ? (
              <p className="text-gray-500 mt-6">Carregando eventos...</p>
            ) : events.length > 0 ? (
              <HomeTableView
                events={events}
                onEventUpdated={updateEvent}
                onRefresh={fetchEvents}
              />
            ) : (
              <div className="mt-6 text-center text-gray-400 dark:text-gray-300">
                <p className="text-lg font-medium mb-2">
                  Nenhum evento encontrado
                </p>
                <p className="text-sm">
                  Os eventos aparecerão aqui quando forem criados.
                </p>
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default Home;











































// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from 'react-router-dom';
// import NavBar from "../includes/NavBar";
// import Sidebar from "../includes/Sidebar";
// import Footer from "../includes/Footer";
// import StatisticCard from '../statisticCard/StatisticCard';
// import { Car, ClipboardList, Wrench, CheckCircle, Clock, Ban } from 'lucide-react';
// import api from '../../api/axios';
// import HomeTableView from "../tableView/HomeTableView";

// function Home() {
//   const navigate = useNavigate();
//   const [events, setEvents] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [drivers, setDrivers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // 🔒 Autenticação
//   useEffect(() => {
//     const authData = localStorage.getItem('authData');
//     if (!authData) navigate('/login');
//   }, [navigate]);

//   // 🧠 Mantém referência do estado anterior para comparar mudanças
//   const prevEventsRef = useRef([]);

//   // === Funções API ===
//   const fetchEvents = async () => {
//     try {
//       const res = await api.get("/events/get-pending");
//       if (res.status === 200) return res.data.events;
//     } catch (err) {
//       console.error("❌ Erro ao buscar eventos:", err);
//     }
//     return [];
//   };

//   const fetchVehicles = async () => {
//     try {
//       const res = await api.get("/vehicle/get");
//       if (res.status === 200) return res.data.vehicle_data;
//     } catch (err) {
//       console.error("❌ Erro ao buscar veículos:", err);
//     }
//     return [];
//   };

//   const fetchDrivers = async () => {
//     try {
//       const res = await api.get("/driver/get");
//       if (res.status === 200) return res.data.driver_data;
//     } catch (err) {
//       console.error("❌ Erro ao buscar motoristas:", err);
//     }
//     return [];
//   };

//   // === Carregar dados iniciais ===
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       const [eventsData, vehiclesData, driversData] = await Promise.all([
//         fetchEvents(),
//         fetchVehicles(),
//         fetchDrivers(),
//       ]);
//       setEvents(eventsData);
//       setVehicles(vehiclesData);
//       setDrivers(driversData);
//       prevEventsRef.current = eventsData;
//       setLoading(false);
//     };
//     loadData();
//   }, []);

//   // === Atualiza evento específico após PUT ===
//   const updateEvent = (updatedEvent) => {
//     setEvents((prev) =>
//       prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
//     );
//   };

//   // === Atualização automática a cada 10s ===
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       const newEvents = await fetchEvents();

//       // Evita atualizar se nada mudou
//       const prevEvents = prevEventsRef.current;
//       if (JSON.stringify(newEvents) !== JSON.stringify(prevEvents)) {
//         setEvents(newEvents);
//         prevEventsRef.current = newEvents;
//         console.log("🔄 Lista de eventos atualizada automaticamente");
//       }
//     }, 10000); // <-- 10 segundos

//     return () => clearInterval(interval);
//   }, []);

//   // === Funções auxiliares ===
//   const isToday = (dateStr) => {
//     if (!dateStr) return false;
//     const [datePart] = dateStr.split(" ");
//     const [day, month, year] = datePart.split("/").map(Number);
//     const today = new Date();
//     const date = new Date(year, month - 1, day);
//     return (
//       date.getFullYear() === today.getFullYear() &&
//       date.getMonth() === today.getMonth() &&
//       date.getDate() === today.getDate()
//     );
//   };

//   // === Eventos do dia (independente de status) ===
//   const todayEvents = events.filter((event) => isToday(event.date_start));

//   // === Contagens por status (somente do dia atual) ===
//   // const totalPending = events.filter(
//   //   (e) => isToday(e.date_start) && e.status_event === "pending"
//   // ).length;
//   const totalPending = events.filter(
//     (e) => e.status_event === "pending"
//   ).length;
  

//   const totalApproved = events.filter(
//     (e) =>
//       isToday(e.date_start) &&
//       ["approved", "pre approved"].includes(e.status_event)
//   ).length;

//   const totalDenied = events.filter(
//     (e) => isToday(e.date_start) && e.status_event === "denied"
//   ).length;


//   // === Cards estatísticos ===
//   const stats = [
//     {
//       title: "Frota Atual",
//       value: vehicles.length,
//       icon: <Car className="w-6 h-6 text-blue-300" />,
//     },
//     {
//       title: "Motoristas",
//       value: drivers.length,
//       icon: <CheckCircle className="w-6 h-6 text-blue-300" />,
//     },
//     // {
//     //   title: "Eventos do Dia",
//     //   value: todayEvents.length,
//     //   icon: <ClipboardList className="w-6 h-6 text-blue-300" />,
//     // },
//     {
//       title: "Eventos Pendentes",
//       value: totalPending,
//       icon: <Clock className="w-6 h-6 text-blue-300" />,
//     },
//     // {
//     //   title: "Aprovados",
//     //   value: totalApproved,
//     //   icon: <CheckCircle className="w-6 h-6 text-green-400" />,
//     // },
//     // {
//     //   title: "Negados",
//     //   value: totalDenied,
//     //   icon: <Ban className="w-6 h-6 text-red-400" />,
//     // },
//     {
//       title: "Veículos em Manutenção",
//       value: "0",
//       icon: <Wrench className="w-6 h-6 text-blue-300" />,
//     },
//   ];

//   return (
//     <div className="flex min-h-screen bg-blue-50 dark:bg-gray-800">
//       <Sidebar />
//       <div className="flex flex-col flex-1 min-h-screen">
//         <NavBar />
//         <main className="flex flex-col flex-1">
//           {/* === Cards === */}
//           <section className="flex flex-wrap gap-6 items-center justify-center dark:bg-gray-700 bg-blue-50 py-6 pb-4">
//             {stats.map((stat, idx) => (
//               <StatisticCard
//                 key={idx}
//                 {...stat}
//                 bgGradient="bg-blue-100 dark:bg-gray-700"
//               />
//             ))}
//           </section>

//           {/* === Tabela === */}
//           <section className="flex-1 flex items-start justify-center dark:bg-gray-700 bg-blue-50 px-6 pb-10">
//             {loading ? (
//               <p className="text-gray-500 mt-6">Carregando eventos...</p>
//             ) : events.length > 0 ? (
//               <HomeTableView
//                 events={events}
//                 onEventUpdated={updateEvent}
//                 onRefresh={fetchEvents}
//               />
//             ) : (
//               <div className="mt-6 text-center text-gray-400 dark:text-gray-300">
//                 <p className="text-lg font-medium mb-2">
//                   Nenhum evento encontrado
//                 </p>
//                 <p className="text-sm">
//                   Os eventos aparecerão aqui quando forem criados.
//                 </p>
//               </div>
//             )}
//           </section>
//         </main>
//         <Footer />
//       </div>
//     </div>
//   );
// }

// export default Home;