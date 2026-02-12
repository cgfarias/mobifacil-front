import { useState, useEffect } from "react";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import { Link } from "react-router-dom";
import {
  CircleArrowLeft,
  Search,
  RefreshCw,
  ArrowRightCircle,
  XCircle,
  Ticket,
  Trash2,
  MoveHorizontal,
} from "lucide-react";
import NavBar from "../includes/NavBar";
import api from '../../api/axios';

function CrossEvent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Carro 1");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

    // --- Carregar eventos do backend ---
    useEffect(() => {
        const fetchEvents = async () => {
            console.log("🔄 Iniciando fetch dos eventos...");

            try {
                const response = await api.get("/events/get-events-matchs");
                console.log("✅ Resposta recebida da API:", response);

                if (response.status === 200) {
                    const data = Array.isArray(response.data)
                        ? response.data
                        : response.data.events;

                    console.log("📦 Dados processados:", data);
                    setEvents(data || []);
                } else {
                    console.warn("⚠️ Status inesperado:", response.status);
                    setEvents([]);
                }
            } catch (err) {
                console.error("❌ Erro ao buscar eventos:", err);
                setEvents([]);
            } finally {
                console.log("✔️ Finalizado fetch dos eventos.");
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);
  

  const isGroupFull = (group) =>
    users.filter((u) => u.group === group).length >= 4;

  const handleDelete = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const handleMove = (id) => {
    const user = users.find((u) => u.id === id);
    const targetGroup = user.group === "Carro 1" ? "Carro 2" : "Carro 1";
    if (isGroupFull(targetGroup))
      return alert(`O ${targetGroup} já está cheio!`);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, group: targetGroup } : u
      )
    );
  };

  const handleAdd = () => {
    if (!newUserName.trim()) return;
    if (isGroupFull(selectedGroup))
      return alert(`O ${selectedGroup} já está cheio!`);
    const newId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    setUsers([
      ...users,
      { id: newId, name: newUserName, photo: null, group: selectedGroup },
    ]);
    setNewUserName("");
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  const filteredUsers = (group) =>
    users
      .filter(
        (u) =>
          u.group === group &&
          u.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

  const renderUser = (user) => (
    <div
      key={user.id}
      className="flex justify-between items-center bg-slate-900 text-slate-200 px-4 py-3 rounded-lg mb-2"
    >
      <div className="flex items-center gap-3">
        {user.photo ? (
          <img src={user.photo} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-300 text-white font-bold flex items-center justify-center">
            👤
          </div>
        )}
        <span className="text-sm">{user.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {!isGroupFull(user.group === "Carro 1" ? "Carro 2" : "Carro 1") ? (
          <button
            onClick={() => handleMove(user.id)}
            className="text-blue-400 hover:text-blue-300"
          >
            <MoveHorizontal size={16} />
          </button>
        ) : (
          <span className="text-gray-600" title="Carro cheio">
            <MoveHorizontal size={16} />
          </span>
        )}
        <button
          onClick={() => handleDelete(user.id)}
          className="text-red-500 hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <NavBar />
        <div className="min-h-screen bg-blue-50 text-gray-700 dark:bg-gray-700 dark:text-white">
          <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
            >
              <CircleArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold">Eventos Cruzados</h1>
          </div>

          <div className="p-6">
            {/* Top Controls */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
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
            </div>

            {/* Tabela de Eventos Cruzados */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-[0_2px_10px_rgba(219,234,254,0.1)] w-full mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100">
                  Eventos Cruzados
                </h2>
                <div className="flex items-center gap-3">
                  <RefreshCw
                    size={20}
                    className="cursor-pointer text-blue-500 hover:text-blue-700"
                    onClick={() => window.location.reload()}
                  />
                </div>
              </div>

              {loading ? (
                <p>Carregando eventos...</p>
              ) : events.length === 0 ? (
                <p>Nenhum evento encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-400 dark:bg-gray-800">
                      <tr>
                        <th className="py-3 px-4 dark:text-blue-50">Evento 1</th>
                        <th className="py-3 px-4 dark:text-blue-50">Evento 2</th>
                        <th className="py-3 px-4 dark:text-blue-50">Destino</th>
                        <th className="py-3 px-4 dark:text-blue-50">Horário</th>
                        <th className="py-3 px-4 dark:text-blue-50">Status</th>
                        <th className="py-3 px-4 dark:text-blue-50">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr
                          key={event.id}
                          className={`cursor-pointer transition-colors duration-200 ${
                            selectedEvent?.id === event.id
                              ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                              : "hover:bg-blue-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => handleEventSelect(event)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={event.event1.avatar}
                                alt={event.event1.name}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                              />
                              <div>
                                <div className="text-sm text-gray-800 dark:text-blue-200 font-medium">
                                  {event.event1.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {event.event1.setor}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={event.event2.avatar}
                                alt={event.event2.name}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                              />
                              <div>
                                <div className="text-sm text-gray-800 dark:text-blue-200 font-medium">
                                  {event.event2.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {event.event2.setor}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-sm py-4 px-4 dark:text-blue-200 max-w-[220px] whitespace-normal break-words">
                            {event.event1.destiny}
                          </td>
                          <td className="text-sm py-4 px-4 dark:text-blue-200">
                            <div>
                              <div>{event.event1.startDate}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {event.event1.endDate}
                              </div>
                            </div>
                          </td>
                          <td className="text-sm py-4 px-4 text-gray-700 dark:text-blue-200">
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-medium ${event.statusColor}`}
                            >
                              {event.status}
                            </span>
                          </td>
                          <td className="text-sm py-4 px-4 dark:text-blue-200">
                            <div className="flex items-center justify-center gap-3">
                              <ArrowRightCircle
                                size={20}
                                className="text-green-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out"
                                onClick={() => alert("Aprovar Cruzamento")}
                              />
                              <XCircle
                                size={20}
                                className="text-red-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out"
                                onClick={() => alert("Negar Cruzamento")}
                              />
                              <Ticket
                                size={20}
                                className="text-gray-400 cursor-pointer hover:scale-120 transition duration-300 ease-in-out"
                                onClick={() => alert("Gerar Voucher")}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Cards de Gerenciamento de Pessoas */}
            {selectedEvent && (
              <div className="bg-slate-800 p-10 text-slate-200 w-full rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    Gerenciamento de Pessoas nos Eventos
                  </h3>
                  <div className="text-sm text-slate-400">
                    Evento selecionado: {selectedEvent.event1.name} &{" "}
                    {selectedEvent.event2.name}
                  </div>
                </div>
                <div className="flex gap-6">
                  {["Carro 1", "Carro 2"].map((group) => (
                    <div
                      key={group}
                      className="w-1/2 bg-slate-700 rounded-lg shadow-md"
                    >
                      <div
                        className={`px-4 py-3 text-lg font-bold text-white ${group === "Carro 1"
                          ? "bg-blue-400"
                          : "bg-blue-400"
                          } rounded-t-lg`}
                      >
                        {group}
                      </div>
                      <div className="p-4">
                        {filteredUsers(group).map(renderUser)}
                        <div className="mt-2 text-xs text-slate-400">
                          {users.filter((u) => u.group === group).length} / 4
                          ocupando este carro
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-4 py-2 w-1/3 placeholder-slate-400"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Novo nome"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-4 py-2 placeholder-slate-400"
                    />
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-2"
                    >
                      <option value="Carro 1">Carro 1</option>
                      <option value="Carro 2">Carro 2</option>
                    </select>
                    <button
                      onClick={handleAdd}
                      disabled={isGroupFull(selectedGroup)}
                      className={`px-4 py-2 rounded ${isGroupFull(selectedGroup)
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        } text-white`}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default CrossEvent;