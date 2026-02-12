import { useRole } from '../hooks/useRole';

const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const { canAccess } = useRole();

  if (canAccess(allowedRoles)) {
    return children;
  }

  return fallback;
};

export default RoleGuard;
