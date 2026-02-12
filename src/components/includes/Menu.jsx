// src/components/SidebarMenu.jsx
import { useState } from "react";
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, House, Ticket, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Menu = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const { user } = useAuth();
  const isVoucher = user?.role === "voucher";
  const isAdmin = user?.role === "admin";

  const toggleMenu = (menu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  if (isVoucher) {
    return (
      <div>
        <div>
          <Link
            to="/voucher"
            className="flex items-center justify-start w-full text-left text-sm font-medium mb-4 text-blue-50 hover:text-blue-400 hover:bg-white/10 px-2 py-1 rounded-md transition duration-300"
          >
            <Ticket className="mr-2" size={16} />
            Vouchers
          </Link>
          {/* <Link
            to="/schedule-event"
            className="flex items-center justify-start w-full text-left text-sm font-medium mb-4 text-blue-50 hover:text-blue-400 hover:bg-white/10 px-2 py-1 rounded-md transition duration-300"
          >
            <Calendar className="mr-2" size={16} />
            Agendar
          </Link> */}
          <Link
            to="/schedule-event"
            className="flex items-center justify-start w-full text-left text-sm font-medium mb-4 text-blue-50 hover:text-blue-400 hover:bg-white/10 px-2 py-1 rounded-md transition duration-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Calendar className="mr-2" size={16} />
            Agendar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/"
        className="flex items-center justify-start w-full text-left text-sm font-medium mb-4 text-blue-50 hover:text-blue-400 hover:bg-white/10 px-2 py-1 rounded-md transition duration-300"
      >
        <House className="mr-2" size={16} />
        Home
      </Link>
      {isAdmin && (
        <Link
          to="/voucher"
          className="flex items-center justify-start w-full text-left text-sm font-medium mb-4 text-blue-50 hover:text-blue-400 hover:bg-white/10 px-2 py-1 rounded-md transition duration-300"
        >
          <Ticket className="mr-2" size={16} />
          Vouchers
        </Link>
      )}

      <button
        onClick={() => toggleMenu("motoristas")}
        className="flex items-center justify-between w-full text-left text-sm font-medium mb-2 text-white cursor-pointer transition duration-300 ease-in-out mb-4"
      >
        Motoristas
        {activeMenu === "motoristas" ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>

      {/* <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          activeMenu === "motoristas" ? "max-h-40 opacity-100" : "max-h-0 opacity-0 p-0"
        } bg-blue-950 dark:bg-gray-950 p-3 rounded-md mb-4`}
      >
        <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
        <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
        <Link
          to="/drivers"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Todos
        </Link>
        <Link
          to="/drivers/new"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Novo
        </Link>
      </div> */}

      {activeMenu === "motoristas" && (
        <div className="bg-blue-950 dark:bg-gray-950 p-3 rounded-md mb-4">
          <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
          <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
          <Link
            to="/drivers"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Todos
          </Link>
          <Link
            to="/drivers/new"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Novo
          </Link>
        </div>
      )}

      {/* <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          activeMenu === "motoristas" ? "max-h-40 opacity-100" : "max-h-0 opacity-0 p-0"
        } bg-blue-950 dark:bg-gray-950 p-3 rounded-md mb-4`}
      >
        <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
        <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
        <Link
          to="/drivers"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Todos
        </Link>
        <Link
          to="/drivers/new"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Novo
        </Link>
      </div> */}

      {/* <div
        className={`origin-top transition-transform transition-opacity duration-300 ease-in-out ${activeMenu === "motoristas"
            ? "scale-y-100 opacity-100"
            : "scale-y-0 opacity-0"
          } bg-blue-950 dark:bg-gray-950 p-3 rounded-md mb-4`}
      >
        <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
        <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
        <Link
          to="/drivers"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Todos
        </Link>
        <Link
          to="/drivers/new"
          className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
        >
          Novo
        </Link>
      </div> */}

      <button
        onClick={() => toggleMenu("veiculos")}
        className="flex items-center justify-between w-full text-left text-sm font-medium mb-2 text-white cursor-pointer transition duration-300 ease-in-out mb-4"
      >
        Veículos
        {activeMenu === "veiculos" ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>

      {activeMenu === "veiculos" && (
        <div className="bg-blue-950 dark:bg-gray-950 p-3 rounded-md mb-4">
          <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
          <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
          <Link
            to="/vehicles"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Todos
          </Link>
          <Link
            to="/vehicles/new"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Novo
          </Link>
        </div>
      )}


      <button
        onClick={() => toggleMenu("aprovarEventos")}
        className="flex items-center justify-between w-full text-left text-sm font-medium mb-2 text-white cursor-pointer transition duration-300 ease-in-out"
      >
        Gerenciar Eventos
        {activeMenu === "aprovarEventos" ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>

      {activeMenu === "aprovarEventos" && (
        <div className="bg-blue-950 dark:bg-gray-950 p-3 rounded-md">
          <p className="mb-2 text-gray-500 text-sm">NAVEGAÇÃO:</p>
          <hr className="border-gray-400 dark:border-gray-700 my-2 mb-4" />
          <Link
            to="/ApproveTransport"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Todos
          </Link>
          {/* <Link
            to="/crossEvent"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Eventos Cruzados
          </Link> */}
          
          <a
            href="/schedule-event"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Agendar
          </a>

          <Link
            to="/dailyCalendar"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Calendário
          </Link>

          {/* <a
            href="/dailyCalendar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Calendario
          </a> */}

          {/* <Link
            to="/schedule-event"
            className="text-xs text-white hover:text-gray-300 cursor-pointer mb-3 block"
          >
            Agendar
          </Link> */}
        </div>
      )}
    </div>
  );
};

export default Menu;
