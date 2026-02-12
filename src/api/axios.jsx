// src/api/axios.jsx
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { showToast } from "../utils/showToast";
import { authLogout } from "../utils/authLogout"; // Função auxiliar explicada abaixo

const api = axios.create({
  // baseURL: "https://cdn.getic.pe.gov.br",
  baseURL: "https://apimob.getic.pe.gov.br",
  headers: { "Content-Type": "application/json" },
});

// Intercepta requisições
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;


          // 🔥 Forçar expiração imediatamente
          if (localStorage.getItem("forceExpire") === "true") {
            console.warn("🔧 Forçando expiração manual do token!");
            localStorage.removeItem("forceExpire");
            authLogout("expired");
            return Promise.reject("Token expirado forçado");
          }




          if (decoded.exp < now) {
            console.warn("⏰ Token expirado localmente (axios).");
            showToast("Sessão expirada. Faça login novamente.", "error");
            authLogout("expired");
            return Promise.reject("Token expirado");
          }

          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("Erro ao ler token:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepta respostas — desloga no 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔒 Sessão expirada pelo backend (401).");
      showToast("Sessão expirada. Faça login novamente.", "error");
      authLogout("expired");
    }
    return Promise.reject(error);
  }
);

export default api;














// import axios from "axios";
// import { jwtDecode } from "jwt-decode"; // ✅ import correto para versões novas

// const api = axios.create({
//   baseURL: "https://cdn.getic.pe.gov.br",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Intercepta todas as requisições
// api.interceptors.request.use(
//   (config) => {
//     const authData = localStorage.getItem("authData");

//     if (authData) {
//       try {
//         const userData = JSON.parse(authData);
//         const token = userData?.token;

//         if (token) {
//           // ✅ Verifica expiração local
//           const decoded = jwtDecode(token);
//           const currentTime = Date.now() / 1000;

//           if (decoded.exp < currentTime) {
//             console.warn("⏰ Token expirado localmente. Limpando sessão...");
//             localStorage.removeItem("authData");
//             window.location.href = "/login";
//             return Promise.reject("Token expirado");
//           }

//           config.headers.Authorization = `Bearer ${token}`;
//         }
//       } catch (err) {
//         console.warn("⚠️ Erro ao processar authData do localStorage:", err);
//       }
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Intercepta respostas (erro 401 do backend)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.warn("🔒 Sessão expirada pelo servidor. Deslogando...");
//       localStorage.removeItem("authData");
//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;




















// import axios from 'axios';


// const api = axios.create({
//     baseURL: 'https://cdn.getic.pe.gov.br',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   });

// api.interceptors.request.use(config => {
//   const authData = localStorage.getItem('authData');
//   // console.log('Raw authData:', authData);

//   if (authData) {
//     try {
//       const userData = JSON.parse(authData);
//       // console.log('Parsed userData:', userData);

//       // Ajuste aqui conforme o objeto real
//       const token = userData?.token;

//       // console.log('Token encontrado:', token);

//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch (err) {
//       console.warn('⚠️ Erro ao processar authData do localStorage:', err);
//       // Se der erro no parse, não adiciona o token
//     }
//   }

//   return config;
// });


// export default api;































// import axios from 'axios';


// const api = axios.create({
//   baseURL: 'https://cdn.getic.pe.gov.br',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// api.interceptors.request.use(config => {
//   const authData = localStorage.getItem('authData');

//   if (authData) {
//     try {
//       const userData = JSON.parse(authData);
//       const token = userData?.user_access_level_data?.user_access_token;

//       console.log("Token:", token);
//       console.log("userData:", userData);
//       console.log("Geral:", localStorage.getItem('authData'));
//       console.log(userData.user_access_level_data?.user_access_token);

      

//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch (err) {
//       console.warn('⚠️ Erro ao processar authData do localStorage:', err);
//       // Se der erro no parse, não adiciona o token
//     }
//   }

//   return config;
// });


// export default api;





// import axios from 'axios';


// const api = axios.create({
//   baseURL: 'https://cdn.getic.pe.gov.br',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Adiciona o token em todas as requisições se existir
// api.interceptors.request.use(config => {
//   // const token = localStorage.getItem('token');
//   const authData = localStorage.getItem('authData');
//   const userData = JSON.parse(authData);

//   const token = userData.user_access_level_data?.user_access_token;
//   // const token = authData ? JSON.parse(authData).user_access_token : null;
//   console.log('--- TOKEN ---');
//   console.log(userData.user_access_level_data?.user_access_token);
  
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;