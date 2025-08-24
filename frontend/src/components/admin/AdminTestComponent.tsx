import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../contexts/AuthContext';

const AdminTestComponent = () => {
  const { isAdmin, canAccessAdmin, principal } = useAdmin();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">User not authenticated</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Admin Access Test</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Principal:</strong> <code className="bg-gray-200 px-1 rounded">{principal}</code>
        </div>
        <div>
          <strong>Is Admin:</strong> 
          <span className={`ml-2 px-2 py-1 rounded ${isAdmin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {isAdmin ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <strong>Can Access Admin:</strong> 
          <span className={`ml-2 px-2 py-1 rounded ${canAccessAdmin() ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {canAccessAdmin() ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
          <p className="text-green-800">✅ Admin access granted</p>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-800">❌ Admin access denied</p>
        </div>
      )}
    </div>
  );
};

export default AdminTestComponent;