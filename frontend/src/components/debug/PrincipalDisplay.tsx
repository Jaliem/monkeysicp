import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const PrincipalDisplay = () => {
  const { principal, isAuthenticated, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyPrincipal = async () => {
    if (principal) {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono max-w-sm z-50">
      <div className="mb-2">
        <strong>Debug Info:</strong>
      </div>
      <div className="mb-1">
        <span className="text-gray-300">Principal:</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs break-all bg-gray-700 p-2 rounded">
          {principal}
        </div>
        <button
          onClick={copyPrincipal}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="text-xs">
        <span className="text-gray-300">Admin Status:</span>{' '}
        <span className={isAdmin ? 'text-green-400' : 'text-red-400'}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </div>
      <div className="text-xs mt-2 text-gray-400">
        Add this principal to adminConfig.ts to grant admin access
      </div>
    </div>
  );
};

export default PrincipalDisplay;