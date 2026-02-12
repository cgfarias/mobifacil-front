import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import UserAvatar from "../user-avatar/UserAvatar";
import ProfileCard from "../profileCard/ProfileCard";
import { Sun, Moon, Bell, XCircle, CircleAlert } from "lucide-react";
import { useDarkMode } from "../../context/ThemeContext";

const NavBar = ({ onBellClick }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  const profileRef = useRef(null);
  const location = useLocation();

  const { darkMode, setDarkMode } = useDarkMode();
  const [showLogoutModal, setShowLogoutModal] = useState(false);


  // ✅ Define páginas com o botão de tema e sino
  const pagesWithToggle = [
    "/schedule-event",
    "/future-events",
    "/event-history",
    "/shared-events",
  ];
  const showToggle = pagesWithToggle.includes(location.pathname);
  const showBell = location.pathname === "/schedule-event";

  useEffect(() => {
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUserData(parsed);
      } catch (error) {
        console.error("Erro ao ler authData do localStorage:", error);
      }
    }
  }, []);

  // Fecha dropdown clicando fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("authData");
    localStorage.removeItem("welcomeModalSeen");
    window.location.href = "https://mobifacil.getic.pe.gov.br/login";
  };
  
  

  return (
    <nav
      className={`transition-colors duration-300 border-b flex justify-between items-center p-4
        ${
          darkMode
            ? "bg-gray-800 border-gray-600 text-white"
            : "bg-blue-50 border-blue-200 text-gray-800"
        }`}
    >


      {/* ✅ Modal de CONFIRMAÇÃO DE LOGOUT */}
{showLogoutModal && (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
      showLogoutModal ? "opacity-100" : "opacity-0"
    }`}
  >
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg w-96 p-6 relative transform transition-all duration-300 ${
        showLogoutModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
      }`}
    >
      {/* Botão X */}
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        onClick={() => setShowLogoutModal(false)}
      >
        <XCircle size={20} />
      </button>

      {/* Título */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-blue-100 mb-4 flex items-center gap-2">
        <CircleAlert size={22} className="text-red-500 dark:text-red-400" />
        Confirmar Logout
      </h2>

      {/* Texto */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
        Tem certeza que deseja{" "}
        <span className="font-medium text-red-500 dark:text-red-400">
          SAIR
        </span>{" "}
        do sistema?
        <br />
        Você precisará fazer login novamente para acessar sua conta.
      </p>

      {/* Botões */}
      <div className="flex justify-end gap-3 mt-2">
        <button
          onClick={() => setShowLogoutModal(false)}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Voltar
        </button>

        <button
          onClick={confirmLogout}
          className={`px-4 py-2 rounded-md text-white transition shadow-md ${
            darkMode
              ? "bg-red-400 hover:bg-red-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}



      {/* Lado Esquerdo */}
      <div className="text-xl font-bold">MobiFácil</div>

      {/* Lado Direito */}
      <div className="flex items-center gap-4">
        {/* 🔔 Sino de notificações (apenas na rota /schedule-event) */}
        {showBell && (
          <button
            onClick={onBellClick}
            className={`relative flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer
              ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
          >
            <Bell
              size={18}
              className="animate-[wiggle_2s_ease-in-out_infinite]"
            />

            {/* 🔴 Bolinha de notificação */}
            {/* <span className="absolute top-1 right-1 block bg-red-500 text-white text-[10px] font-bold px-[6px] py-[1px] rounded-full shadow-md"></span> */}
            {/* 🔴 Bolinha de notificação (sem número) */}
            <span className="absolute -top-1 right-6 block w-2.5 h-2.5 bg-red-500 rounded-full shadow-md"></span>

            {/* 🎵 Keyframes da animação */}
            <style>{`
              @keyframes wiggle {
                0%, 100% { transform: rotate(0deg); }
                20% { transform: rotate(-10deg); }
                40% { transform: rotate(12deg); }
                60% { transform: rotate(-8deg); }
                80% { transform: rotate(6deg); }
              }
            `}</style>
          </button>
        )}

        {/* 🌙 / 🌞 Botão de Tema */}
        {showToggle && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer
              ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
          >
            {darkMode ? (
              <Sun
                size={16}
                className="text-yellow-400 transition-transform duration-300 hover:rotate-45"
              />
            ) : (
              <Moon
                size={16}
                className="text-gray-700 transition-transform duration-300 hover:rotate-45"
              />
            )}
          </button>
        )}

        {/* Avatar e dropdown */}
        <div
          ref={profileRef}
          className="flex items-center space-x-3 cursor-pointer relative"
          onClick={() => setShowProfile(!showProfile)}
        >
          {/* Texto do Usuário */}
          <div className="flex flex-col items-end text-sm leading-tight">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {userData?.nickname || "Usuário"}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              Online
            </span>
            {/* <span className="text-gray-500 dark:text-gray-300 text-xs">
              ID: {userData?.user_id || "---"}
            </span> */}
          </div>

          {/* Avatar */}
          <UserAvatar
            src={
              userData?.user_avatar ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            size="lg"
            border
            bgColor="bg-blue-100"
            rounded="full"
            onlineStatus={true}
          />

          {/* Dropdown */}
          {showProfile && (
            <>
              <div className="fixed inset-0 bg-black/20 z-40" />
              <div
                className="absolute top-14 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-xl border
                           border-gray-200 dark:border-gray-600 p-3 w-56 animate-fadeSlideDown"
              >
                <ProfileCard
                  onLogout={handleLogout}
                  onClose={() => setShowProfile(false)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;



































// import React, { useState, useEffect, useRef } from "react";
// import { useLocation } from "react-router-dom";
// import UserAvatar from "../user-avatar/UserAvatar";
// import ProfileCard from "../profileCard/ProfileCard";
// import { Sun, Moon, Bell } from "lucide-react";
// import { useDarkMode } from "../../context/ThemeContext";

// const NavBar = ({ onBellClick }) => {
//   const [showProfile, setShowProfile] = useState(false);
//   const [userData, setUserData] = useState(null);
//   const profileRef = useRef(null);
//   const location = useLocation();

//   const { darkMode, setDarkMode } = useDarkMode();

//   // ✅ Define páginas com o botão de tema e sino
//   const pagesWithToggle = [
//     "/schedule-event",
//     "/future-events",
//     "/event-history",
//     "/shared-events",
//   ];
//   const showToggle = pagesWithToggle.includes(location.pathname);
//   const showBell = location.pathname === "/schedule-event";

//   useEffect(() => {
//     const authData = localStorage.getItem("authData");
//     if (authData) {
//       try {
//         const parsed = JSON.parse(authData);
//         setUserData(parsed);
//       } catch (error) {
//         console.error("Erro ao ler authData do localStorage:", error);
//       }
//     }
//   }, []);

//   // Fecha dropdown clicando fora
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (profileRef.current && !profileRef.current.contains(event.target)) {
//         setShowProfile(false);
//       }
//     };
//     if (showProfile) document.addEventListener("mousedown", handleClickOutside);
//     else document.removeEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showProfile]);

//   const handleLogout = () => {
//     localStorage.removeItem("authData");
//     localStorage.removeItem("welcomeModalSeen")
//     alert("Usuário deslogado");
//     window.location.href = "https://mobifacil.getic.pe.gov.br/login";
//     // window.location.href = "http://localhost:5173/login";
//   };

//   return (
//     <nav
//       className={`transition-colors duration-300 border-b flex justify-between items-center p-4
//         ${
//           darkMode
//             ? "bg-gray-800 border-gray-600 text-white"
//             : "bg-blue-50 border-blue-200 text-gray-800"
//         }`}
//     >
//       {/* Lado Esquerdo */}
//       <div className="text-xl font-bold">MobiFácil</div>

//       {/* Lado Direito */}
//       <div className="flex items-center gap-4">
//         {/* 🔔 Sino de notificações (apenas na rota /schedule-event) */}
//         {showBell && (
//           <button
//             onClick={onBellClick}
//             className={`relative flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer
//               ${
//                 darkMode
//                   ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
//                   : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//               }`}
//           >
//             <Bell
//               size={18}
//               className="animate-[wiggle_2s_ease-in-out_infinite]"
//             />

//             {/* 🔴 Bolinha de notificação */}
//             {/* <span className="absolute top-1 right-1 block bg-red-500 text-white text-[10px] font-bold px-[6px] py-[1px] rounded-full shadow-md"></span> */}
//             {/* 🔴 Bolinha de notificação (sem número) */}
//             <span className="absolute -top-1 right-6 block w-2.5 h-2.5 bg-red-500 rounded-full shadow-md"></span>

//             {/* 🎵 Keyframes da animação */}
//             <style>{`
//               @keyframes wiggle {
//                 0%, 100% { transform: rotate(0deg); }
//                 20% { transform: rotate(-10deg); }
//                 40% { transform: rotate(12deg); }
//                 60% { transform: rotate(-8deg); }
//                 80% { transform: rotate(6deg); }
//               }
//             `}</style>
//           </button>
//         )}

//         {/* 🌙 / 🌞 Botão de Tema */}
//         {showToggle && (
//           <button
//             onClick={() => setDarkMode(!darkMode)}
//             className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer
//               ${
//                 darkMode
//                   ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
//                   : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//               }`}
//           >
//             {darkMode ? (
//               <Sun
//                 size={16}
//                 className="text-yellow-400 transition-transform duration-300 hover:rotate-45"
//               />
//             ) : (
//               <Moon
//                 size={16}
//                 className="text-gray-700 transition-transform duration-300 hover:rotate-45"
//               />
//             )}
//           </button>
//         )}

//         {/* Avatar e dropdown */}
//         <div
//           ref={profileRef}
//           className="flex items-center space-x-3 cursor-pointer relative"
//           onClick={() => setShowProfile(!showProfile)}
//         >
//           {/* Texto do Usuário */}
//           <div className="flex flex-col items-end text-sm leading-tight">
//             <span className="font-semibold text-gray-900 dark:text-gray-100">
//               {userData?.nickname || "Usuário"}
//             </span>
//             <span className="text-gray-500 dark:text-gray-400 text-xs">
//               Online
//             </span>
//             {/* <span className="text-gray-500 dark:text-gray-300 text-xs">
//               ID: {userData?.user_id || "---"}
//             </span> */}
//           </div>

//           {/* Avatar */}
//           <UserAvatar
//             src={
//               userData?.user_avatar ||
//               "https://cdn-icons-png.flaticon.com/512/149/149071.png"
//             }
//             size="lg"
//             border
//             bgColor="bg-blue-100"
//             rounded="full"
//             onlineStatus={true}
//           />

//           {/* Dropdown */}
//           {showProfile && (
//             <>
//               <div className="fixed inset-0 bg-black/20 z-40" />
//               <div
//                 className="absolute top-14 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-xl border
//                            border-gray-200 dark:border-gray-600 p-3 w-56 animate-fadeSlideDown"
//               >
//                 <ProfileCard
//                   onLogout={handleLogout}
//                   onClose={() => setShowProfile(false)}
//                 />
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default NavBar;