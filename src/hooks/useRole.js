import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user } = useAuth();

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  const isAdmin = () => hasRole('admin');
  const isModerator = () => hasRole('moderator');
  const isComun = () => hasRole('comum');
  const isVoucher = () => hasRole('voucher');

  const canAccess = (allowedRoles) => {
    return hasRole(allowedRoles);
  };

  return {
    userRole: user?.role || null,
    hasRole,
    isAdmin,
    isModerator,
    isComun,
    isVoucher,
    canAccess
  };
};
