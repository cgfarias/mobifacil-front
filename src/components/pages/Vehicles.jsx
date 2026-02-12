import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CircleArrowLeft,
  Bolt,
  Circle,
  PowerOff,
  BadgeCheck,
  Shapes,
  ScanLine,
  Tags
} from 'lucide-react';

import NavBar from "../includes/NavBar";
import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import api from '../../api/axios';

const Vehicles = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [vehicle, setVehicle] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para verificar se o usuário é admin
  const isUserAdmin = () => {
    try {
      const authData = localStorage.getItem('authData');
      if (!authData) return false;
      const userData = JSON.parse(authData);
      // return userData.user_access_level_data?.role === 'admin'
      //   ? console.log("Sim")
      //   : console.log("Não");
    } catch (error) {
      console.error('Erro ao verificar role do usuário:', error);
      return false;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get('/vehicle/get');
        const dados = response.data['vehicle_data'];

        if (response.status === 200) {
          // console.log(dados);
          setVehicle(dados);
          setMessage(response.data.message);

          // 🟩 Armazenar os dados no localStorage
          localStorage.setItem('vehicle_data', JSON.stringify(dados));

          // Printar apenas os IDs dos motoristas
          // dados.forEach(vehicle => {
          //   console.log('-----> ' + vehicle.driver_id);
          // });
        } else {
          console.log('Status atual: ', response.status);
        }
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
      }
    }

    fetchData();
  }, []);

  // Função para desativar veículo e remover da lista
  const handleDeactivateVehicle = async (vehicleId) => {
    if (!window.confirm('Tem certeza que deseja desativar este veículo?')) return;

    setLoading(true);
    try {
      const response = await api.put(`/vehicle/${vehicleId}/deactivate`);

      if (response.status === 200) {
        alert('🚗 Veículo desativado com sucesso!');

        // 🔁 Atualiza a tabela removendo o veículo imediatamente
        setVehicle((prevVehicles) => {
          const updated = prevVehicles.filter(v => v.vehicle_id !== vehicleId);
          localStorage.setItem('vehicle_data', JSON.stringify(updated));
          return updated;
        });
      } else {
        alert('Erro ao desativar veículo. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao desativar veículo:', error);
      alert('Erro ao desativar veículo. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filtro de busca
  const filteredVehicles = vehicle.filter(v =>
    (v.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.status_situation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.status_activity?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

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
          {/* Header */}
          <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
            >
              <CircleArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold">Listando Veículos</h1>
          </div>

          <div className="p-6">
            {/* 🔍 Top Controls */}
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
                      to="/vehicles/new"
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Novo Veículo
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 🧾 Tabela */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f7f9fc] dark:bg-gray-800">
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <BadgeCheck size={16} /> Marca
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Shapes size={16} /> Modelo
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <ScanLine size={16} /> Placa
                        </div>
                      </th>
                      <th className="text-left px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Tags size={16} /> Categoria
                        </div>
                      </th>
                      <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Circle size={16} /> Situação
                        </div>
                      </th>
                      <th className="text-center px-6 py-5 text-sm font-bold text-gray-800 uppercase dark:text-blue-50">
                        <div className="flex items-center gap-2">
                          <Bolt size={16} /> Status
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
                    {currentVehicles.length > 0 ? (
                      currentVehicles.map((vehicle) => (
                          <tr
                              key={vehicle.vehicle_id}
                              className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out hover:shadow-sm transform"
                          >
                              <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                      <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-blue-100 group-hover:text-blue-400 transition-colors duration-200">{vehicle.mark}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="text-sm text-gray-600 dark:text-blue-100 font-medium group-hover:text-gray-400 transition-colors duration-200">{vehicle.model}</div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="text-sm text-gray-600 dark:text-blue-100 font-medium group-hover:text-gray-400 transition-colors duration-200">{vehicle.plate}</div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="text-sm text-gray-600 dark:text-blue-100 font-medium group-hover:text-gray-400 transition-colors duration-200">{vehicle.category}</div>
                              </td>
                              <td className="px-6 py-5">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group-hover:shadow-sm ${vehicle.status_situation === 'active' ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200' :
                                      vehicle.status_situation === 'active' ? 'bg-blue-100 text-blue-800 group-hover:bg-blue-200' :
                                          vehicle.status_situation === 'active' ? 'bg-purple-100 text-purple-800 group-hover:bg-purple-200' :
                                              vehicle.status_situation === 'maintenance' ? 'bg-rose-100 text-rose-800 group-hover:bg-rose-200' :
                                                  vehicle.status_situation === 'out_of_service' ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-200' :
                                                      'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                      }`}>
                                      {vehicle.status_situation === 'active' ? 'Ativo' : 'Inativo'}
                                  </span>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                      <div className={`relative w-3 h-3 rounded-full shadow-sm ${vehicle.status_activity === 'available' ? 'bg-emerald-500' : 'bg-red-400'} 
                                                              ${vehicle.status_activity === 'available' ? 'shadow-emerald-200' : 'shadow-red-200'}
                                                              group-hover:shadow-md transition-shadow duration-200`}>
                                          {/* Animação de pulso */}
                                          <div className={`absolute inset-0 rounded-full animate-ping ${vehicle.status_activity === 'available' ? 'bg-emerald-400' : 'bg-red-400'
                                              } opacity-75`}>
                                          </div>
                                          <div className={`absolute inset-0 rounded-full animate-ping ${vehicle.status_activity === 'available' ? 'bg-emerald-300' : 'bg-red-300'
                                              } opacity-30`}>
                                          </div>
                                      </div>
                                      <span className={`text-sm font-medium transition-colors duration-200 ${vehicle.status_activity === 'available'
                                              ? 'text-emerald-500 group-hover:text-emerald-500'
                                              : 'text-red-400 group-hover:text-red-400'
                                          }`}>
                                          {vehicle.status_activity === 'available' ? 'Disponível' : "Atribuído"}
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="flex justify-center gap-3">
                                      <Link to={`/vehicles/${vehicle.vehicle_id}/edit`} className="p-2.5 text-slate-400 cursor-pointer hover:text-blue-600 hover:bg-blue-200 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md group/edit">
                                          <Edit size={16} className="group-hover/edit:scale-110 transition-transform duration-200" />
                                      </Link>
                                      {vehicle.status_situation === 'active' && (
                                          <button
                                              onClick={() => handleDeactivateVehicle(vehicle.vehicle_id)}
                                              disabled={loading}
                                              className="p-2.5 text-slate-400 cursor-pointer hover:text-amber-600 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md group/deactivate disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Desativar veículo"
                                          >
                                              <PowerOff size={16} className="group-hover/deactivate:scale-110 transition-transform duration-200" />
                                          </button>
                                      )}
                                      {isUserAdmin() && (
                                          <button className="p-2.5 text-slate-400 cursor-pointer hover:text-rose-600 hover:bg-rose-100 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md group/delete">
                                              <Trash2 size={16} className="group-hover/delete:scale-110 transition-transform duration-200" />
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Search size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-blue-200 mb-2">
                              Nenhum veículo encontrado
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              {searchTerm
                                ? `Não foi possível encontrar resultados para "${searchTerm}".`
                                : 'Não há veículos cadastrados no sistema.'}
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

            {/* Footer de paginação */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600 dark:text-blue-50">
                  Exibindo de {startIndex + 1} à {Math.min(endIndex, filteredVehicles.length)} de {filteredVehicles.length} registros
                  {searchTerm && (
                    <span className="text-blue-500 dark:text-blue-300 ml-2">
                      (Filtrado de {vehicle.length} registros)
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

export default Vehicles;