import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';

const identityProvider = 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943';

const Login = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);

    const isAuthenticated = await client.isAuthenticated();
    if (isAuthenticated) {
      navigate('/datas');
    }
  };

  const login = async () => {
    if (!authClient) return;

    setIsLoading(true);

    try {
      await authClient.login({
        identityProvider,
        onSuccess: () => {
          navigate('/datas');
        },
        onError: (error) => {
          console.error('Login failed:', error);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome!</h1>
        <p className="text-gray-600 mb-8">
          Please login with <span className="font-semibold">Internet Identity</span> to continue.
        </p>

        <button
          onClick={login}
          disabled={isLoading || !authClient}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition ${
            isLoading || !authClient
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Logging in...' : 'Login with Internet Identity'}
        </button>
      </div>
    </div>
  );
};

export default Login;
