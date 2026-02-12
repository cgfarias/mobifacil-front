// src/components/ListaMotoristas.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

const statusOptions = ['Todos', 'Disponível', 'Lotado', 'Pendente', 'Cancelado', 'Recusado'];

export default function ListaMotoristas({ motoristas }) {
  const [statusFiltro, setStatusFiltro] = useState('Todos');

  const motoristasFiltrados = motoristas.filter((motorista) => {
    if (statusFiltro === 'Todos') return true;
    return motorista.status === statusFiltro;
  });

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Motoristas</h2>

      {/* Filtro */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Status:</label>
        <select
          className="border border-gray-300 rounded p-2"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <ul className="space-y-2">
        {motoristasFiltrados.length > 0 ? (
          motoristasFiltrados.map((motorista) => (
            <li
              key={motorista.id}
              className="border p-4 rounded shadow-sm flex justify-between items-center"
            >
              <span className="font-medium">{motorista.nome}</span>
              <span
                className={`text-sm font-semibold px-2 py-1 rounded 
                  ${
                    motorista.status === 'Disponível'
                      ? 'bg-green-100 text-green-800'
                      : motorista.status === 'Lotado'
                      ? 'bg-yellow-100 text-yellow-800'
                      : motorista.status === 'Pendente'
                      ? 'bg-blue-100 text-blue-800'
                      : motorista.status === 'Cancelado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
              >
                {motorista.status}
              </span>
            </li>
          ))
        ) : (
          <p className="text-gray-500">Nenhum motorista encontrado.</p>
        )}
      </ul>
    </div>
  );
}

// Definindo o formato esperado para as props
ListaMotoristas.propTypes = {
  motoristas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nome: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
};
