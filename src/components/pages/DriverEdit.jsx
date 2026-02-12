import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NavBar from '../includes/NavBar';
import Sidebar from '../includes/Sidebar';
import Footer from '../includes/Footer';
import { CircleArrowLeft } from 'lucide-react';

const DriverEdit = () => {
  const { driver_id } = useParams();
  const [form, setForm] = useState({
    driver_name: '',
    driver_phone: '',
    driver_email: '',
    driver_category: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 🔹 Carregar dados do motorista
  useEffect(() => {
    api
      .get(`/driver/${driver_id}/get`)
      .then((res) => {
        const motorista = res.data.driver_data?.[0] || {};
        setForm({
          driver_name: motorista.driver_name ?? '',
          driver_phone: motorista.driver_phone ?? '',
          driver_email: motorista.driver_email ?? '',
          driver_category: motorista.driver_category ?? ''
        });
      })
      .catch(() => {
        setError('Erro ao carregar dados do motorista.');
      });
  }, [driver_id]);

  // 🔹 Atualizar estado do form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Enviar atualização
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/driver/${driver_id}/update`, form);
      setSuccess('Motorista atualizado com sucesso!');
      setTimeout(() => navigate('/drivers'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar motorista.');
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
            to="/Drivers"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
          >
            <CircleArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Editar Motorista</h1>
        </div>

        {/* Card do formulário */}
        <div className="mt-10 bg-[#f7f9fc] dark:bg-gray-800 p-8 m-10 rounded shadow rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center dark:text-blue-50">
            Atualizar Dados
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Nome */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Nome
              </label>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>

            {/* Telefone */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Telefone
              </label>
              <input
                type="text"
                name="driver_phone"
                value={form.driver_phone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>

            {/* E-mail */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                E-mail
              </label>
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

            {/* Categoria */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
                Categoria
              </label>
              <input
                type="text"
                name="driver_category"
                value={form.driver_category}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
                required
              />
            </div>

            {/* Mensagens */}
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}

            {/* Botão */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
            >
              Salvar
            </button>
          </form>
        </div>

        {/* Footer - agora só na área direita */}
        <Footer />
      </div>
    </div>
  );
};

export default DriverEdit;



















// import React, { useState, useEffect } from 'react';
// import api from '../../api/axios';
// import { useNavigate, useParams, Link } from 'react-router-dom';
// import NavBar from '../includes/NavBar';
// import Sidebar from '../includes/Sidebar';
// import Footer from '../includes/Footer';
// import { CircleArrowLeft } from 'lucide-react';

// const DriverEdit = () => {
//   const { driver_id } = useParams();
//   const [form, setForm] = useState({
//     driver_name: '',
//     driver_phone: '',
//     driver_category: ''
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     api
//       .get(`/driver/${driver_id}/get`)
//       .then((res) => {
//         const motorista = res.data.driver_data?.[0] || {};
//         setForm({
//           driver_name: motorista.driver_name ?? '',
//           driver_phone: motorista.driver_phone ?? '',
//           driver_category: motorista.driver_category ?? ''
//         });
//       })
//       .catch(() => {
//         setError('Erro ao carregar dados do motorista.');
//       });
//   }, [driver_id]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     try {
//       await api.put(`/driver/${driver_id}/update`, form);
//       setSuccess('Motorista atualizado com sucesso!');
//       setTimeout(() => navigate('/drivers'), 1200);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Erro ao atualizar motorista.');
//     }
//   };

//   return (
//     <div className="flex min-h-screen">
//       {/* Sidebar fixa à esquerda */}
//       <Sidebar />

//       <div className="flex flex-col flex-1 bg-blue-50 dark:bg-gray-700">
//         <NavBar />

//         {/* Header */}
//         <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
//           <Link
//             to="/Drivers"
//             className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
//           >
//             <CircleArrowLeft size={20} />
//           </Link>
//           <h1 className="text-xl font-semibold">Editar Motorista</h1>
//         </div>

//         {/* Card do formulário */}
//         <div className="mt-10 bg-[#f7f9fc] dark:bg-gray-800 p-8 m-10 rounded shadow rounded-lg">
//           <h2 className="text-2xl font-bold mb-6 text-center dark:text-blue-50">
//             Atualizar Dados
//           </h2>
//           <form onSubmit={handleSubmit}>
//             <div className="mb-4">
//               <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
//                 Nome
//               </label>
//               <input
//                 type="text"
//                 name="driver_name"
//                 value={form.driver_name}
//                 onChange={handleChange}
//                 className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
//                 required
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
//                 Telefone
//               </label>
//               <input
//                 type="text"
//                 name="driver_phone"
//                 value={form.driver_phone}
//                 onChange={handleChange}
//                 className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
//                 required
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block mb-1 text-sm font-bold text-gray-800 dark:text-blue-50">
//                 Categoria
//               </label>
//               <input
//                 type="text"
//                 name="driver_category"
//                 value={form.driver_category}
//                 onChange={handleChange}
//                 className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:bg-blue-50"
//                 required
//               />
//             </div>
//             {error && <div className="text-red-500 mb-2">{error}</div>}
//             {success && <div className="text-green-600 mb-2">{success}</div>}
//             <button
//               type="submit"
//               className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
//             >
//               Salvar
//             </button>
//           </form>
//         </div>

//         {/* Footer - agora só na área direita */}
//         <Footer />
//       </div>
//     </div>
//   );
// };

// export default DriverEdit;









// import React, { useState, useEffect } from 'react';
// import api from '../../api/axios';
// import { useNavigate, useParams } from 'react-router-dom';

// const DriverEdit = () => {
//   const { driver_id } = useParams();
//   const [form, setForm] = useState({
//     driver_name: '',
//     driver_phone: '',
//     driver_category: ''
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const navigate = useNavigate();

//   // DEBUG: Log do driver_id
//   console.log('🔍 DriverEdit - driver_id recebido:', driver_id);
//   console.log('🔍 DriverEdit - URL completa:', window.location.href);

//   useEffect(() => {
//     console.log('🚀 DriverEdit - Fazendo GET para:', `/driver/${driver_id}/get`);
    
//     api.get(`/driver/${driver_id}/get`)
//       .then(res => {
//         console.log('✅ DriverEdit - Resposta da API:', res.data);

//         const motorista = res.data.driver_data?.[0] || {};

//         console.log('✅ Motorista encontrado:', motorista);

//         setForm({
//           driver_name: motorista.driver_name ?? '',
//           driver_phone: motorista.driver_phone ?? '',
//           driver_category: motorista.driver_category ?? ''
//         });
//       })
//       .catch(err => {
//         console.error('❌ DriverEdit - Erro na API:', err);
//         console.error('❌ DriverEdit - Status:', err.response?.status);
//         console.error('❌ DriverEdit - Mensagem:', err.response?.data);
//         setError('Erro ao carregar dados do motorista.');
//       });
//   }, [driver_id]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     try {
//       await api.put(`/driver/${driver_id}/update`, form);
//       setSuccess('Motorista atualizado com sucesso!');
//       setTimeout(() => navigate('/drivers'), 1200);
//     } catch (err) {
//       setError(
//         err.response?.data?.message || 'Erro ao atualizar motorista.'
//       );
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-900 p-8 rounded shadow">
//       <h2 className="text-2xl font-bold mb-6 text-center">Editar Motorista</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label className="block mb-1 font-medium">Nome</label>
//           <input
//             type="text"
//             name="driver_name"
//             value={form.driver_name}
//             onChange={handleChange}
//             className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400 bg-gray-100"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-1 font-medium">Telefone</label>
//           <input
//             type="text"
//             name="driver_phone"
//             value={form.driver_phone}
//             onChange={handleChange}
//             className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block mb-1 font-medium">Categoria</label>
//           <input
//             type="text"
//             name="driver_category"
//             value={form.driver_category}
//             onChange={handleChange}
//             className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
//             required
//           />
//         </div>
//         {error && <div className="text-red-500 mb-2">{error}</div>}
//         {success && <div className="text-green-600 mb-2">{success}</div>}
//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
//         >
//           Salvar
//         </button>
//       </form>
//     </div>
//   );
// };

// export default DriverEdit; 