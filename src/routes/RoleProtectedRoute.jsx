// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import AccessDenied from "../components/pages/AccessDenied";
// import { useEffect, useState } from "react";

// const RoleProtectedRoute = ({
//   children,
//   allowedRoles = [],
//   fallbackPath = "/schedule-event",
//   showAccessDenied = false,
// }) => {
//   const { isAuthenticated, user, loading } = useAuth();
//   const location = useLocation();

//   // 🔥 estado interno para controlar o redirect
//   const [shouldRedirect, setShouldRedirect] = useState(false);

//   // Se loading, mostra carregando
//   if (loading) return <div>Carregando...</div>;

//   // 🔥 se perder autenticação (logout automático), aguarda toast aparecer
//   useEffect(() => {
//     if (!isAuthenticated) {
//       const timer = setTimeout(() => setShouldRedirect(true), 300);
//       return () => clearTimeout(timer);
//     }
//   }, [isAuthenticated]);

//   // 🔥 quando deve redirecionar
//   if (shouldRedirect) {
//     return <Navigate to="/login" replace state={{ from: location }} />;
//   }

//   // Se não autenticado (mas ainda não redirecionando), não renderiza nada
//   if (!isAuthenticated) {
//     return null; // impede desmontar antes do toast
//   }

//   // Se não tem usuário ou role
//   if (!user || !user.role) {
//     return <Navigate to="/login" replace />;
//   }

//   const userRole = user.role;

//   // Se a rota não exige roles
//   if (allowedRoles.length === 0) {
//     return children;
//   }

//   // Se role permitido
//   if (allowedRoles.includes(userRole)) {
//     return children;
//   }

//   // Página de acesso negado opcional
//   if (showAccessDenied) {
//     return <AccessDenied />;
//   }

//   // Redirecionamentos por role
//   if (userRole === "comum") {
//     return <Navigate to="/schedule-event" replace />;
//   } else if (userRole === "moderator" || userRole === "admin") {
//     return <Navigate to="/" replace />;
//   } else if (userRole === "voucher") {
//     return <Navigate to="/voucher" replace />;
//   }

//   return <Navigate to={fallbackPath} replace />;
// };

// export default RoleProtectedRoute;














import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from '../components/pages/AccessDenied';

const RoleProtectedRoute = ({ children, allowedRoles = [], fallbackPath = "/schedule-event", showAccessDenied = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Se ainda está carregando, mostra loading
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se não tem usuário ou role, redireciona para login
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  // Se não há roles permitidos definidos, permite acesso (compatibilidade com rotas sem restrição)
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verifica se o role do usuário está na lista de roles permitidos
  if (allowedRoles.includes(userRole)) {
    return children;
  }

  // Se o usuário não tem permissão e showAccessDenied é true, mostra página de acesso negado
  if (showAccessDenied) {
    return <AccessDenied />;
  }

  // Se o usuário não tem permissão, redireciona para a página padrão baseada no role
  // comum -> /schedule-event
  // moderator/admin -> página inicial
  // voucher -> /voucher
  if (userRole === "comum") {
    return <Navigate to="/schedule-event" replace />;
  } else if (userRole === "moderator" || userRole === "admin") {
    return <Navigate to="/" replace />;
  } else if (userRole === "voucher") {
    return <Navigate to="/voucher" replace />;
  }

  // Fallback para outros roles
  return <Navigate to={fallbackPath} replace />;
};

export default RoleProtectedRoute;