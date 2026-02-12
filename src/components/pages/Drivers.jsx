import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Edit,
  CircleArrowLeft,
  User,
  Phone,
  Users,
  Circle,
  Bolt,
  PowerOff,
} from 'lucide-react';

import NavBar from "../includes/NavBar";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import api from '../../api/axios';

const Drivers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [motoristas, setMotoristas] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔁 Função de busca reutilizável
  const fetchMotoristas = useCallback(async () => {
    try {
      const response = await api.get('/driver/get');
      const dados = response.data['driver_data'];

      if (response.status === 200) {
        // console.log('✅ Drivers - Dados carregados:', dados);
        setMotoristas(dados);
        setMessage(response.data.message);
        localStorage.setItem('driver_data', JSON.stringify(dados));
      } else {
        console.log('Status atual: ', response.status);
      }
    } catch (error) {
      console.error('❌ Drivers - Erro ao buscar motoristas:', error);
    }
  }, []);

  // 🧠 Buscar ao montar o componente
  useEffect(() => {
    fetchMotoristas();
  }, [fetchMotoristas]);



  const testAlert = () => {
    alert('Botão testAlert clicado!');
  };





  // 🔄 Desativar motorista + atualizar lista
  const deactivateDriver = async (driverId) => {
    // alert('Teste')
    if (!window.confirm('Tem certeza que deseja desativar este motorista?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/driver/${driverId}/deactivate`);

      if (response.status === 200) {
        alert('Motorista desativado com sucesso!');
        // 🔁 Recarregar lista após sucesso
        await fetchMotoristas();
        setCurrentPage(1); // ✅ Voltar para a primeira página após reload
      } else {
        alert('Erro ao desativar motorista. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao desativar motorista:', error);
      alert('Erro ao desativar motorista. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filtrar motoristas
  const filteredMotoristas = motoristas.filter(motorista =>
    motorista.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motorista.driver_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motorista.driver_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (motorista.driver_status || 'Ativo').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMotoristas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMotoristas = filteredMotoristas.slice(startIndex, endIndex);

  // Resetar página quando buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
            <h1 className="text-xl font-semibold">Listando motoristas</h1>
          </div>

          <div className="p-6">
            {/* Top Controls */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">registros</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">Buscar:</span>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                      placeholder="Digite para buscar..."
                    />
                    <Link
                      to="/drivers/new"
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Novo Motorista
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f7f9fc] dark:bg-gray-800">
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <User size={16} /> Motorista
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Phone size={16} /> Telefone
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Users size={16} /> Grupo
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Circle size={16} /> Situação
                        </div>
                      </th>
                      <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Bolt size={16} /> Ações
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMotoristas.length > 0 ? (
                      currentMotoristas.map((motorista) => (
                        <tr
                          key={motorista.driver_id}
                          className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out hover:shadow-sm transform"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                {motorista.driver_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-blue-100 group-hover:text-blue-400 transition-colors duration-200">
                                  {motorista.driver_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-600 dark:text-blue-100 font-medium">
                            {motorista.driver_phone}
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group-hover:shadow-sm ${motorista.driver_category === 'Operacional'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : motorista.driver_category === 'DOE'
                                    ? 'bg-blue-100 text-blue-800'
                                    : motorista.driver_category === 'DOB'
                                      ? 'bg-purple-100 text-purple-800'
                                      : motorista.driver_category === 'Presidencia'
                                        ? 'bg-rose-100 text-rose-800'
                                        : motorista.driver_category === 'Canal do Fragoso'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                              {motorista.driver_category}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`relative w-3 h-3 rounded-full shadow-sm ${motorista.driver_status === 'active'
                                    ? 'bg-emerald-500'
                                    : 'bg-red-400'
                                  }`}
                              >
                                <div
                                  className={`absolute inset-0 rounded-full animate-ping ${motorista.driver_status === 'active'
                                      ? 'bg-emerald-400'
                                      : 'bg-red-400'
                                    } opacity-75`}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-medium ${motorista.driver_status === 'active'
                                    ? 'text-emerald-500'
                                    : 'text-red-400'
                                  }`}
                              >
                                {motorista.driver_status === 'active'
                                  ? 'Ativo'
                                  : 'Desativado'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center gap-3">
                              <Link
                                to={`/drivers/${motorista.driver_id}/edit`}
                                className="p-2.5 text-slate-400 cursor-pointer hover:text-blue-600 hover:bg-blue-200 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
                              >
                                <Edit size={16} />
                              </Link>

                              {motorista.driver_status === 'active' && (
                                <button
                                  onClick={() => deactivateDriver(motorista.driver_id)}
                                  // onClick={() => testAlert}
                                  disabled={loading}
                                  className="p-2.5 text-slate-400 cursor-pointer hover:text-amber-600 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Desativar motorista"
                                >
                                  <PowerOff size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Search size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-blue-200 mb-2">
                              Nenhum motorista encontrado
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              {searchTerm
                                ? `Não foi possível encontrar resultados para "${searchTerm}". Tente buscar com outros termos.`
                                : 'Não há motoristas cadastrados no sistema.'}
                            </p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-blue-500 dark:bg-gray-500 text-gray-50 text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300"
                              >
                                Limpar busca
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600 dark:text-blue-50">
                  Exibindo de {startIndex + 1} à {Math.min(endIndex, filteredMotoristas.length)} de {filteredMotoristas.length} registros
                  {searchTerm && (
                    <span className="text-blue-500 dark:text-blue-300 ml-2">
                      (Filtrado de {motoristas.length} registros)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 cursor-pointer text-sm font-medium border border-gray-200 rounded-lg hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 cursor-pointer text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${currentPage === page
                          ? 'bg-blue-500 dark:bg-blue-400 text-white dark:text-blue-200 border border-blue-600 dark:border-blue-600'
                          : 'border border-gray-200 hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 cursor-pointer text-sm font-medium border border-gray-200 rounded-lg hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Drivers;