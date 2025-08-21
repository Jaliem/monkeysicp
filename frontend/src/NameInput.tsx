import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';
import { healthService } from './services/healthService';

const NameInput = () => {
  const [principal, setPrincipal] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [tempName, setTempName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const client = await AuthClient.create();
    const isAuthenticated = await client.isAuthenticated();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const identity = client.getIdentity();
    const principalId = identity.getPrincipal().toString();
    setPrincipal(principalId);
    
    const storedName = localStorage.getItem(`userName_${principalId}`);
    if (storedName) {
      navigate('/chat');
      return;
    }
    
    setIsLoading(false);
  };

  const saveName = async () => {
    if (!tempName.trim()) return;
    
    setIsSaving(true);
    
    try {
      // Store name in localStorage associated with the principal
      localStorage.setItem(`userName_${principal}`, tempName.trim());
      setUserName(tempName.trim());
      
      // Store name in the backend canister
      const wellnessData = {
        user_id: principal,
        date: new Date().toISOString().split('T')[0],
        sleep: `UserName: ${tempName.trim()}`,
        steps: 0,
        exercise: 'Registration',
        mood: 'Good',
        water_intake: 0
      };
      await healthService.storeWellnessLog(wellnessData);
      
      // Redirect to chat page
      navigate('/chat');
    } catch (error) {
      console.error('Error storing name:', error);
      // Even if backend storage fails, continue to chat with local storage
      navigate('/chat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveName();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-emerald-50 font-serif">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-stone-600 font-light text-lg">Setting up your personalized experience...</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-8">
          
          <h1 className="text-4xl font-light text-stone-800 mb-4 leading-tight">
            Almost there!
          </h1>
          
          <p className="text-stone-600 font-light text-lg leading-relaxed mb-2">
            What would you like us to call you?
          </p>
        
        </div>

        {/* Input section */}
        <div className="space-y-6 mb-8">
          <div className="relative">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your preferred name"
              className="w-full px-6 py-4 border-2 border-stone-200 rounded-full focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 text-center text-lg font-light transition-all duration-300 placeholder-stone-400"
              disabled={isSaving}
              autoFocus
            />
          </div>
          
          <button
            onClick={saveName}
            disabled={!tempName.trim() || isSaving}
            className={`w-full py-4 px-8 rounded-full font-medium text-lg transition-all duration-300 transform ${
              tempName.trim() && !isSaving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 shadow-lg'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating your profile...</span>
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-100">
          <p className="text-stone-400 text-sm font-light leading-relaxed">
            Your name will be used to personalize your health experience and is stored securely on the{' '}
            <span className="text-emerald-600 font-medium">Internet Computer</span>
          </p>
        </div>

        {/* Privacy badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-stone-500">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-sm font-light">Your data remains private & secure</span>
        </div>
      </div>
    </div>
  );
};

export default NameInput;