// import { useState, useEffect } from "react";

// export const AUTH_KEYS = {
//   token: "app_token",
//   userId: "app_user_id",
//   role: "app_user_role",
//   userFullName: "app_user_fullname",  // opcional, info extra
//   userAvatar: "app_user_avatar",      // opcional, info extra
// };

// // Salva no localStorage
// export function saveAuth({ token, userId, role, userFullName, userAvatar }) {
//   if (token) localStorage.setItem(AUTH_KEYS.token, token);
//   if (userId) localStorage.setItem(AUTH_KEYS.userId, userId);
//   if (role) localStorage.setItem(AUTH_KEYS.role, role);
//   if (userFullName) localStorage.setItem(AUTH_KEYS.userFullName, userFullName);
//   if (userAvatar) localStorage.setItem(AUTH_KEYS.userAvatar, userAvatar);
// }

// // Limpa localStorage
// export function clearAuth() {
//   Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
// }

// // Hook para usar autenticação no React
// export function useAuth() {
//   const [authData, setAuthData] = useState(() => {
//     return {
//       token: localStorage.getItem(AUTH_KEYS.token),
//       userId: localStorage.getItem(AUTH_KEYS.userId),
//       role: localStorage.getItem(AUTH_KEYS.role),
//       userFullName: localStorage.getItem(AUTH_KEYS.userFullName),
//       userAvatar: localStorage.getItem(AUTH_KEYS.userAvatar),
//       isAuthenticated: !!localStorage.getItem(AUTH_KEYS.token),
//     };
//   });

//   // Atualiza estado e localStorage ao fazer login
//   function addUser(user) {
//     saveAuth(user);
//     setAuthData({
//       token: user.token || null,
//       userId: user.user_id || null,
//       role: user.role || null,
//       userFullName: user.user_fullname || null,
//       userAvatar: user.user_avatar || null,
//       isAuthenticated: !!user.token,
//     });
//   }

//   function login() {
//     setAuthData((prev) => ({ ...prev, isAuthenticated: true }));
//   }

//   function logout() {
//     clearAuth();
//     setAuthData({
//       token: null,
//       userId: null,
//       role: null,
//       userFullName: null,
//       userAvatar: null,
//       isAuthenticated: false,
//     });
//   }

//   return {
//     ...authData,
//     addUser,
//     login,
//     logout,
//   };
// }









// export const AUTH_KEYS = {
//   token: "app_token",
//   userId: "app_user_id",
//   role: "app_user_role",
// };

// export function saveAuth({ token, userId, role }) {
//   localStorage.setItem(AUTH_KEYS.token, token);
//   if (userId) localStorage.setItem(AUTH_KEYS.userId, userId);
//   if (role) localStorage.setItem(AUTH_KEYS.role, role);
// }

// export function clearAuth() {
//   Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
// }

// export function getAuth() {
//   return {
//     token: localStorage.getItem(AUTH_KEYS.token),
//     userId: localStorage.getItem(AUTH_KEYS.userId),
//     role: localStorage.getItem(AUTH_KEYS.role),
//   };
// }

// export function isAuthenticated() {
//   return !!localStorage.getItem(AUTH_KEYS.token);
// }