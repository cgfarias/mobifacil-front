import { useState, useEffect } from "react";
import { MenuIcon, X } from "lucide-react";
import Menu from "./Menu";
import DarkModeToggler from "../DarkModeToggler"; // ✅ Usa o mesmo componente global
import { useDarkMode } from "../../context/ThemeContext";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { darkMode } = useDarkMode(); // ✅ Só precisa ler o tema, não alterar aqui

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Em desktop, sidebar sempre aberta
      if (!mobile) setIsOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Botão de toggle para mobile */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed z-50 top-4 left-4 p-2 rounded-md bg-blue-900 text-white md:hidden"
        >
          {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 w-64 min-h-screen p-4 transition-transform duration-300 ease-in-out
          ${darkMode ? "bg-gray-900 text-white" : "bg-blue-900 text-white"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex justify-center">
          {/* <img
            src="/logo-pernambuco.png"
            alt="Logo Pernambuco"
            className="w-40 h-auto mb-4"
          /> */}
        </div>

        <h2 className="text-sm font-semibold mb-6 text-center tracking-wide">
          MOBIFÁCIL
        </h2>

        {/* ✅ Apenas o botão do componente DarkModeToggler */}
        <div className="flex items-center justify-center mb-5">
          <DarkModeToggler />
        </div>

        {/* Menu principal */}
        <Menu />
      </div>
    </>
  );
};

export default Sidebar;