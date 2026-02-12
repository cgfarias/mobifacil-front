import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NavBar from '../includes/NavBar';
import Sidebar from '../includes/Sidebar';
import Footer from '../includes/Footer';
import { CircleArrowLeft } from 'lucide-react';

const VehicleEdit = () => {
  const { vehicle_id } = useParams();
  const [form, setForm] = useState({
    model: '',
    mark: '',
    category: '',
    plate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get(`/vehicle/${vehicle_id}/get`)
      .then((res) => {
        const vehicle = res.data.vehicle_data?.[0] || {};
        setForm({
          model: vehicle.model ?? '',
          mark: vehicle.mark ?? '',
          category: vehicle.category ?? '',
          plate: vehicle.plate ?? ''
        });
      })
      .catch(() => {
        setError('Erro ao carregar dados do veículo.');
      });
  }, [vehicle_id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/vehicle/${vehicle_id}/update`, form);
      setSuccess('Veículo atualizado com sucesso!');
      setTimeout(() => navigate('/vehicles'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar veículo.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      <div className="flex flex-col flex-1 bg-blue-50 dark:bg-gray-700">
        <NavBar />

        {/* Header */}
        <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
          <Link
            to="/Vehicles"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
          >
            <CircleArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Editar Veículo</h1>
        </div>

        {/* Card do formulário */}
        <div className="mt-10 bg-[#f7f9fc] dark:bg-gray-800 p-8 m-10 rounded shadow rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center dark:text-blue-50">
            Atualizar Dados do Veículo
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Modelo
              </label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Marca
              </label>
              <input
                type="text"
                name="mark"
                value={form.mark}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Categoria
              </label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Placa
              </label>
              <input
                type="text"
                name="plate"
                value={form.plate}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
            >
              Salvar
            </button>
          </form>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default VehicleEdit;