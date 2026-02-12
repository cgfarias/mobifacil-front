import React, { useState } from 'react';
import api from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from '../includes/NavBar';
import Sidebar from '../includes/Sidebar';
import Footer from '../includes/Footer';
import { CircleArrowLeft } from 'lucide-react';

const DriverCreate = () => {
  const [form, setForm] = useState({
    driver_name: '',
    driver_phone: '',
    driver_email: '',
    driver_category: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/driver/new', form);
      console.log(form);
      setSuccess('Motorista cadastrado com sucesso!');
      setTimeout(() => navigate('/drivers'), 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Erro ao cadastrar motorista.'
      );
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      <div className="flex flex-col flex-1 bg-blue-50 dark:bg-gray-700">
        <NavBar />

        <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
          <Link
            to="/Drivers"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
          >
            <CircleArrowLeft size={20} />
          </Link>

          <h1 className="text-xl font-semibold">Formulário de Motorista</h1>
        </div>

        <div className="mt-10 bg-[#f7f9fc] dark:bg-gray-800 p-8 m-10 rounded shadow rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center dark:text-blue-50">Novo Motorista</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">Nome</label>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">Telefone</label>
              <input
                type="text"
                name="driver_phone"
                value={form.driver_phone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">E-mail</label>
              <input
                type="email"
                name="driver_email"
                value={form.driver_email}
                onChange={handleChange}
                placeholder="exemplo@dominio.com"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">Categoria</label>
              <input
                type="text"
                name="driver_category"
                value={form.driver_category}
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
              Cadastrar
            </button>
          </form>
        </div>
        
        {/* Footer - agora só na área direita */}
        <Footer />

      </div>
    </div>
  );
};

export default DriverCreate; 
