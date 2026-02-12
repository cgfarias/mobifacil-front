import { useState, useEffect } from "react";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import { Link } from "react-router-dom";
import NavBar from "../includes/NavBar";
import { CircleArrowLeft, Search } from "lucide-react";
import api from '../../api/axios';
import ApproveTransportTableView from "../tableView/ApproveTransportTableView";

function ApproveTransport() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dos eventos
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events/get");

        if (response.status === 200) {
          // garante que venha array
          if (Array.isArray(response.data.events)) {
            setEvents(response.data.events);
            // console.log(response.data.events)
          } else {
            setEvents([]);
          }
        } else if (response.status === 401) {
          setError("Não autorizado. Faça login novamente.");
        } else {
          setError("Erro ao carregar eventos.");
        }
      } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        setError("Falha ao conectar com o servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filtro de busca
  const filteredEvents = events.filter((event) =>
    Object.values(event).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Container principal */} 
      <div className="flex flex-col flex-1">
        <NavBar />

        <div className="min-h-screen bg-blue-50 text-gray-700 dark:bg-gray-700 dark:text-white">
          {/* Header */}
          <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
            >
              <CircleArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold">Eventos Gerais</h1>
          </div>

          <div className="p-6">
            {/* Top Controls */}
            {/* <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">
                    Mostrar
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">
                    registros
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">
                    Buscar:
                  </span>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                      placeholder="Digite para buscar..."
                    />
                  </div>
                </div>
              </div>
            </div> */}

            {/* Conteúdo */}
            {loading ? (
              <p className="text-center text-gray-500">Carregando eventos...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredEvents.length > 0 ? (
              <ApproveTransportTableView data={filteredEvents} />
            ) : (
              <p className="text-center text-gray-500">
                Nenhum evento encontrado.
              </p>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default ApproveTransport;