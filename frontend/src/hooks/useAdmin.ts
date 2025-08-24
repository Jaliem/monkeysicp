import { useAuth } from '../contexts/AuthContext';

export const useAdmin = () => {
  const { isAuthenticated, isAdmin, principal, checkAdminStatus } = useAuth();

  return {
    isAdmin: isAuthenticated && isAdmin,
    isAuthenticated,
    principal,
    checkAdminStatus,
    canAccessAdmin: () => isAuthenticated && isAdmin,
  };
};

export default useAdmin;