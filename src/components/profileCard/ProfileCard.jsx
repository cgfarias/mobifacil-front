import React from "react";
import { LogOut } from "lucide-react";

const ProfileCard = ({ onLogout, onClose }) => {
  return (
    <>
      {/* Overlay (clique fora) */}
      {/* <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose} 
      ></div> */}

      {/* Card */}
      <div
        className="fixed right-10 top-16 w-72 bg-gray-900 text-white rounded-xl shadow-xl p-4 border border-gray-700 z-50
                   animate-fadeSlideDown"
        onClick={(e) => e.stopPropagation()} // impede clique interno fechar o card
      >
        {/* Botão de Logout */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // impede o overlay fechar
            onLogout();          // agora abre o modal corretamente
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 font-semibold text-white
                     bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                     py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          Sair da conta
        </button>

        {/* Versão */}
        <p className="text-[10px] text-gray-500 mt-2 text-center">v.6.14.0</p>
      </div>
    </>
  );
};

export default ProfileCard;










// import React from "react";

// const ProfileCard = ({ onLogout, onClose }) => {
//   return (
//     <>
//       {/* Overlay para capturar clique fora */}
//       <div
//         className="fixed inset-0 z-40"
//         onClick={onClose}
//       ></div>

//       {/* Card */}
//       <div className="fixed right-10 top-16 w-72 bg-gray-900 text-white rounded-lg shadow-lg p-4 border border-gray-700 z-50">
//         {/* Header com Avatar e Info */}
//         <div className="flex items-center space-x-3 border-b border-gray-700 pb-3">
//           <img
//             src="https://api.dicebear.com/7.x/adventurer/svg?seed=Angel"
//             alt="Avatar"
//             className="w-12 h-12 rounded-full"
//           />
//           <div>
//             <h2 className="text-lg font-bold">Caio Farias</h2>
//             <p className="text-sm text-gray-400">caioguimaraesfarias@g...</p>
//             <a href="#" className="text-blue-400 text-xs hover:underline">
//               Painel de controle
//             </a>
//           </div>
//         </div>

//         {/* Espaço usado */}
//         {/* <div className="my-3">
//           <p className="text-xs text-gray-400">Grátis</p>
//           <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
//             <div className="bg-blue-500 h-2 rounded-full w-[17%]"></div>
//           </div>
//           <p className="text-xs mt-1">8,58 GB de 50 GB</p>
//         </div> */}

//         {/* Ações */}
//         {/* <ul className="text-sm space-y-2">
//           <li><a href="#" className="hover:underline">Upgrade</a></li>
//           <li><a href="#" className="hover:underline">Fazer download da chave de recuperação</a></li>
//           <li><a href="#" className="hover:underline">Configurações</a></li>
//           <li><a href="#" className="hover:underline">Instalar o app para desktop</a></li>
//           <li><a href="#" className="hover:underline">Recarregar a conta</a></li>
//         </ul> */}

//         {/* Botão de Logout */}
//         <button
//           onClick={onLogout}
//           className="w-full text-left text-red-600 hover:text-red-700 mt-2 font-medium cursor-pointer transition-colors duration-150"
//         >
//           Sair
//         </button>


//         {/* Rodapé */}
//         {/* <div className="mt-3 text-xs text-gray-500 flex justify-between">
//           <span>Idioma</span>
//           <span>Suporte</span>
//           <span>Legal</span>
//         </div> */}
//         <p className="text-[10px] text-gray-600 mt-1">v.6.14.0</p>
//       </div>
//     </>
//   );
// };

// export default ProfileCard;
