// src/utils/authLogout.js
export function authLogout(reason = "expired") {
    localStorage.removeItem("authData");
  
    if (reason === "expired") {
      localStorage.setItem("expiredSession", "true"); // 👈 marca a expiração REAL
    }
  
    // redirecionamento
    window.location.href = "/login";
  }
  



// // src/utils/authLogout.js
// export function authLogout() {
//     localStorage.removeItem("authData");
  
//     // Redireciona de forma limpa
//     if (window.location.pathname !== "/login") {
//       setTimeout(() => (window.location.href = "/login"), 2000);
//     }
//   }  