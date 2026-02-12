// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { showToast } from "../utils/showToast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 Logout centralizado
  // src/context/AuthContext.jsx
  const logout = useCallback((reason = "manual") => {
    localStorage.removeItem("authData");

    // 👇 só marca como expirada se for logout por expiração
    if (reason === "expired") {
      localStorage.setItem("expiredSession", "true");
    }

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  
  // const logout = useCallback((showMessage = true) => {
  //   localStorage.removeItem("authData");
  //   setUser(null);
  //   setIsAuthenticated(false);

  //   if (showMessage) {
  //     showToast("Sessão expirada. Faça login novamente.", "error");
  //   }
  // }, []);


  // 🧠 Cria um timer de expiração em runtime
  const configureAutoLogoutTimer = useCallback((expTimestamp) => {
    const msUntilExpire = expTimestamp * 1000 - Date.now();

    if (msUntilExpire <= 0) {
      // Token já expirado
      logout(true);
      return;
    }

    console.log(`⏳ Auto-logout agendado para ${msUntilExpire} ms`);
    setTimeout(() => {
      console.warn("⏰ Token expirou automaticamente!");
      logout(true);
    }, msUntilExpire);
  }, [logout]);

  // 📌 Valida o token SALVO no localStorage ao abrir o app
  // 📌 Valida o token SALVO no localStorage ao abrir o app
  useEffect(() => {
    const storedData = localStorage.getItem("authData");

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const token = parsed?.token;

        if (token) {
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;

          // 🔥 TOKEN EXPIRADO AO ABRIR O APP
          if (decoded.exp < now) {
            console.warn("⏰ Token expirado ao abrir o app.");
            logout("expired"); // 👈 Marcação correta
          } else {
            setUser(parsed);
            setIsAuthenticated(true);

            // ⏳ Configura o logout automático
            configureAutoLogoutTimer(decoded.exp);
          }
        } else {
          logout("manual");
        }
      } catch (error) {
        console.error("⚠️ Erro ao validar token:", error);
        logout("manual");
      }
    }

    setLoading(false);
  }, [logout, configureAutoLogoutTimer]);

  // useEffect(() => {
  //   const storedData = localStorage.getItem("authData");

  //   if (storedData) {
  //     try {
  //       const parsed = JSON.parse(storedData);
  //       const token = parsed?.token;

  //       if (token) {
  //         const decoded = jwtDecode(token);
  //         const now = Date.now() / 1000;

  //         if (decoded.exp < now) {
  //           console.warn("⏰ Token expirado ao abrir o app.");
  //           logout(true);
  //         } else {
  //           setUser(parsed);
  //           setIsAuthenticated(true);

  //           // ⏳ Configura o logout automático
  //           configureAutoLogoutTimer(decoded.exp);
  //         }
  //       } else {
  //         logout(false);
  //       }
  //     } catch (error) {
  //       console.error("⚠️ Erro ao validar token:", error);
  //       logout(false);
  //     }
  //   }

  //   setLoading(false);
  // }, [logout, configureAutoLogoutTimer]);

  // 🔐 Login
  const login = (userData) => {
    localStorage.setItem("authData", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    // Ativa timer de expiração ao fazer login também
    try {
      const decoded = jwtDecode(userData.token);
      configureAutoLogoutTimer(decoded.exp);
    } catch (e) {
      console.error("Erro ao decodificar token no login:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);














// // src/context/AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { jwtDecode } from "jwt-decode";
// import { showToast } from "../utils/showToast"; // ✅ utilitário opcional para mensagens

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // Função de logout centralizada
//   const logout = useCallback((showMessage = true) => {
//     localStorage.removeItem("authData");
//     setUser(null);
//     setIsAuthenticated(false);

//     if (showMessage) showToast("Sessão expirada. Faça login novamente.", "error");
//   }, []);

//   // Valida o token salvo no localStorage ao carregar o app
//   useEffect(() => {
//     const storedData = localStorage.getItem("authData");
//     if (storedData) {
//       try {
//         const parsed = JSON.parse(storedData);
//         const token = parsed?.token;

//         if (token) {
//           const decoded = jwtDecode(token);
//           const currentTime = Date.now() / 1000;

//           if (decoded.exp < currentTime) {
//             console.warn("⏰ Token expirado ao abrir o app.");
//             logout(true);
//           } else {
//             setUser(parsed);
//             setIsAuthenticated(true);
//           }
//         } else {
//           logout(false);
//         }
//       } catch (error) {
//         console.error("⚠️ Erro ao validar token:", error);
//         logout(false);
//       }
//     }
//     setLoading(false);
//   }, [logout]);

//   const login = (userData) => {
//     localStorage.setItem("authData", JSON.stringify(userData));
//     setUser(userData);
//     setIsAuthenticated(true);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);














// // context/AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect } from 'react';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true); // ← ADICIONADO

//   useEffect(() => {
//     const storedData = localStorage.getItem('authData');
//     if (storedData) {
//       try {
//         const parsed = JSON.parse(storedData);
//         setUser(parsed);
//         setIsAuthenticated(true);
//       } catch (error) {
//         console.error('Erro ao analisar authData:', error);
//         localStorage.removeItem('authData');
//       }
//     }
//     setLoading(false); // ← FINALIZA verificação
//   }, []);

//   const login = (userData) => {
//     localStorage.setItem('authData', JSON.stringify(userData));
//     setUser(userData);
//     setIsAuthenticated(true);
//   };

//   const logout = () => {
//     localStorage.removeItem('authData');
//     setUser(null);
//     setIsAuthenticated(false);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);