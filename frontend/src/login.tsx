import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';

const identityProvider = 'https://identity.ic0.app';

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
      navigate('/chat');
    }
  };

  const login = async () => {
    if (!authClient) return;

    setIsLoading(true);

    try {
      await authClient.login({
        identityProvider,
        onSuccess: () => {
          navigate('/chat');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-emerald-50 px-8 font-serif relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-200 rounded-full opacity-25"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-amber-200 rounded-full opacity-15"></div>
      
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-12 text-center relative z-10 border border-stone-100">
        {/* Header section */}
        <div className="mb-8">
          <div className="text-3xl font-light text-emerald-700 mb-6 tracking-wide">Cura.</div>
          <div className="w-16 h-1 bg-emerald-400 mx-auto rounded-full mb-8"></div>
        </div>

        {/* Welcome content */}
        <h1 className="text-4xl font-light text-stone-800 mb-6 leading-tight">
          Welcome back
        </h1>
        
        <p className="text-stone-600 mb-4 font-light text-lg leading-relaxed">
          Please login with{' '}
          <span className="relative">
            <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              Internet Identity
            </span>
          </span>{' '}
          to continue your health journey.
        </p>
        
  
        {/* Login button */}
        <button
          onClick={login}
          disabled={isLoading || !authClient}
          className={`w-full py-4 px-8 rounded-full font-medium text-lg transition-all duration-300 transform ${
            isLoading || !authClient
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 shadow-lg'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            'Login with Internet Identity'
          )}
        </button>

        {/* Additional info */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          <p className="text-stone-400 text-sm font-light">
            New to Cura?{' '}
            <span className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium transition-colors duration-200">
              Learn more about Internet Identity
            </span>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-stone-500">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-sm font-light">Secured by Web3 Technology</span>
        </div>
      </div>
    </div>
  );
};

export default Login;