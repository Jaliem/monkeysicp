import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { isAdminPrincipal } from '../../config/adminConfig';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, principal, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setCheckingAdmin(true);
      
      if (!isAuthenticated || !principal) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      // Check if current principal is in admin list
      const adminStatus = isAdminPrincipal(principal);
      setIsAdmin(adminStatus);
      
      // Log for debugging
      console.log('Admin check:', {
        principal,
        isAdmin: adminStatus
      });
      
      setCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [isAuthenticated, principal]);

  // Show loading while checking authentication or admin status
  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00c26e] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.warn('Unauthorized access attempt to admin route - not authenticated');
    return <Navigate to="/login" replace />;
  }

  // Redirect to main page if not admin
  if (!isAdmin) {
    console.warn(`Unauthorized access attempt to admin route by principal: ${principal}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this admin area.
            </p>
            <button
              onClick={() => window.location.href = '/chat'}
              className="px-6 py-2 bg-[#00c26e] text-white rounded-lg hover:bg-[#00a856] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render admin content if all checks pass
  return <>{children}</>;
};

export default AdminRoute;