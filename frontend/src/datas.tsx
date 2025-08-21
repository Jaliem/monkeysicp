import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';
import HealthForm from './HealthForm';
import { healthService } from './services/healthService';

const Datas = () => {
  const [principal, setPrincipal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);
    
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
      setUserName(storedName);
    } else {
      setShowNameInput(true);
    }
    
    setIsLoading(false);
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    navigate('/');
  };

  const saveName = async () => {
    if (!tempName.trim()) return;
    
    // Store name in localStorage associated with the principal
    localStorage.setItem(`userName_${principal}`, tempName.trim());
    setUserName(tempName.trim());
    setShowNameInput(false);
    
    try {
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
    } catch (error) {
      console.error('Error storing name in canister:', error);
    }
  };

  const goToHome = () => {
    navigate('/home');
  };

  const loadHealthData = async () => {
    if (!authClient) return;
    
    setIsLoadingHealth(true);
    try {
      const identity = authClient.getIdentity();
      const userId = identity.getPrincipal().toString();
      
      const [wellness, symptoms, reminders] = await Promise.all([
        healthService.getWellnessSummary(userId),
        healthService.getSymptomHistory(userId),
        healthService.getReminders(userId)
      ]);
      
      setHealthData({
        wellness: wellness,
        symptoms: symptoms,
        reminders: reminders
      });
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const getShortPrincipal = (principal: string) => {
    if (principal.length > 20) {
      return `${principal.substring(0, 10)}...${principal.substring(principal.length - 10)}`;
    }
    return principal;
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome! What's your name?</h2>
            <p className="text-gray-600 mb-4">Please enter your name to personalize your experience.</p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
            />
            <button
              onClick={saveName}
              disabled={!tempName.trim()}
              className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                tempName.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Name
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Hello{userName ? `, ${userName}` : ''}! 
            </h1>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome!</h2>
          <p className="text-gray-600">You are successfully logged in.</p>
          {userName && (
            <button
              onClick={goToHome}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Continue →
            </button>
          )}
        </div>

        {/* Identity Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Identity</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600"><strong>Principal ID:</strong></p>
            <code className="block bg-gray-100 p-3 rounded text-sm text-gray-800 break-all">
              {principal}
            </code>
            <p className="text-sm text-gray-500">
              Short version: {getShortPrincipal(principal)}
            </p>
          </div>
        </div>

        {/* Health Information Dashboard */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Information Dashboard</h3>
          <p className="text-gray-600 mb-4">Manage your comprehensive health information and medical records.</p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={() => setShowHealthForm(!showHealthForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {showHealthForm ? 'Hide Health Form' : 'Complete Health Information Form'}
            </button>
            
            <button
              onClick={loadHealthData}
              disabled={isLoadingHealth}
              className={`px-4 py-2 rounded-lg transition ${
                isLoadingHealth 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoadingHealth ? 'Loading...' : 'Load My Health Data'}
            </button>
          </div>
          
          {healthData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Your Stored Health Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-blue-600">{healthData.wellness?.total_count || 0}</div>
                  <div className="text-sm text-gray-600">Wellness Logs</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-green-600">{healthData.symptoms?.total_count || 0}</div>
                  <div className="text-sm text-gray-600">Symptom Records</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-purple-600">{healthData.reminders?.active_count || 0}</div>
                  <div className="text-sm text-gray-600">Active Reminders</div>
                </div>
              </div>
            </div>
          )}
          
          {showHealthForm && (
            <div className="mt-6">
              <HealthForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Datas;