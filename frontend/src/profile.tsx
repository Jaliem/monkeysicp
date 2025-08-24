import { useState, useEffect } from 'react';
import Navbar from './nav';
import { storeUserProfile, fetchUserProfile } from './services/flaskService';
import { useAuth } from './contexts/AuthContext';

interface HealthProfile {
  personalInfo: {
    name: string;
    age: number;
    gender: string;
    height: number; // in cm
    weight: number; // in kg
    bloodType: string;
    phoneNumber: string;
    emergencyContact: string;
  };
  medicalHistory: {
    allergies: string;
    medications: string;
    conditions: string;
    surgeries: string;
  };
  preferences: {
    preferredDoctor: string;
    preferredPharmacy: string;
    notificationSettings: {
      medicationReminders: boolean;
      appointmentReminders: boolean;
      wellnessInsights: boolean;
    };
    privacyLevel: 'public' | 'private' | 'anonymous';
  };
}

const Profile = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { principal, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [validationState, setValidationState] = useState({
    personal: false,
    medical: false,
    preferences: false
  });
  const [profile, setProfile] = useState<HealthProfile>({
    personalInfo: {
      name: '',
      age: 0,
      gender: '',
      height: 0,
      weight: 0,
      bloodType: '',
      phoneNumber: '',
      emergencyContact: ''
    },
    medicalHistory: {
      allergies: '',
      medications: '',
      conditions: '',
      surgeries: ''
    },
    preferences: {
      preferredDoctor: '',
      preferredPharmacy: '',
      notificationSettings: {
        medicationReminders: true,
        appointmentReminders: true,
        wellnessInsights: true
      },
      privacyLevel: 'private'
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'preferences'>('personal');

  useEffect(() => {
    initProfile();
  }, [principal]); // Depend on principal from AuthContext

  const initProfile = async () => {
    if (!principal) return; // Wait for principal to be available
    
    setIsLoading(true);
    try {
      // Try to load user profile from ICP backend
      console.log('Loading user profile from ICP for principal:', principal);
      const result = await fetchUserProfile(principal);
        
        if (result.success && result.profile) {
          console.log('Profile loaded successfully:', result.profile);
          setProfile(result.profile);
          updateValidation(result.profile);
      } else {
        console.log('No profile found, user needs to set up profile');
        // Show name collection modal for first-time users
        setShowNameModal(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setSaveStatus({type: 'error', message: 'Failed to load user profile'});
    } finally {
      setIsLoading(false);
    }
  };

  const validatePersonalInfo = (personalInfo: HealthProfile['personalInfo']) => {
    // All personal information fields must be filled
    return [
      personalInfo.name,
      personalInfo.age,
      personalInfo.gender,
      personalInfo.height,
      personalInfo.weight,
      personalInfo.bloodType,
      personalInfo.phoneNumber,
      personalInfo.emergencyContact
    ].every(field => {
      if (typeof field === 'number') {
        return field > 0;
      }
      return field.trim() !== '';
    });
  };

  const validateMedicalHistory = (medicalHistory: HealthProfile['medicalHistory']) => {
    // Allow medical history to be valid even if some categories are empty
    // Just check that at least one category has an entry, or allow empty for new users
    return true; // Medical history is always considered valid
  };

  const validatePreferences = (preferences: HealthProfile['preferences']) => {
    // All preference fields must be filled and at least one notification enabled
    return [
      preferences.preferredDoctor,
      preferences.preferredPharmacy,
      preferences.privacyLevel
    ].every(field => field.trim() !== '') &&
    Object.values(preferences.notificationSettings).some(setting => setting === true);
  };

  const updateValidation = (currentProfile: HealthProfile) => {
    setValidationState({
      personal: validatePersonalInfo(currentProfile.personalInfo),
      medical: validateMedicalHistory(currentProfile.medicalHistory),
      preferences: validatePreferences(currentProfile.preferences)
    });
  };

  const handleInputChange = (section: keyof HealthProfile, field: string, value: any) => {
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      
      // Update validation state after changes
      updateValidation(newProfile);
      return newProfile;
    });
  };


  const handleSave = async () => {
    if (!principal) {
      setSaveStatus({type: 'error', message: 'User not authenticated'});
      return;
    }

    setIsSaving(true);
    setSaveStatus({type: null, message: ''});
    
    try {
      console.log('Saving profile to ICP for principal:', principal);
      const result = await storeUserProfile(profile, principal);
      
      if (result.success) {
        console.log('Profile saved successfully:', result);
        setSaveStatus({type: 'success', message: 'Profile saved successfully!'});
        
        // Refresh profile data to ensure it's up to date
        const updatedProfile = await fetchUserProfile(principal);
        if (updatedProfile.success && updatedProfile.profile) {
          setProfile(updatedProfile.profile);
          updateValidation(updatedProfile.profile);
        }
      } else {
        throw new Error(result.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus({
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save profile'
      });
    } finally {
      setIsSaving(false);
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus({type: null, message: ''}), 3000);
    }
  };

  const handleNameSubmit = async () => {
    if (!tempName.trim() || !principal) return;
    
    setIsLoading(true);
    try {
      // Create initial profile with just the name
      const initialProfile = {
        ...profile,
        personalInfo: {
          ...profile.personalInfo,
          name: tempName.trim()
        }
      };
      
      const result = await storeUserProfile(initialProfile, principal);
      if (result.success) {
        setProfile(initialProfile);
        updateValidation(initialProfile);
        setShowNameModal(false);
        setTempName('');
        setSaveStatus({type: 'success', message: 'Welcome! Your profile has been created.'});
        setTimeout(() => setSaveStatus({type: null, message: ''}), 3000);
      } else {
        throw new Error(result.message || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Failed to create initial profile:', error);
      setSaveStatus({
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'personal' | 'medical' | 'preferences') => {
    setActiveTab(tab);
    // Validation state is already up to date, no need to revalidate
  };

  const tabClasses = (tab: string) => 
    `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      activeTab === tab
        ? 'bg-emerald-600 text-white shadow-md'
        : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
    }`;

  // Loading screen
  // Handle conditional rendering after all hooks have been called
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !principal) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Please log in to access your health profile</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-stone-600 font-light">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
                  Profile
                </h1>
                {saveStatus.type && (
                  <div className={`mt-2 px-3 py-1 rounded-lg text-sm font-light ${
                    saveStatus.type === 'success' 
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {saveStatus.message}
                  </div>
                )}
              </div>
              {principal && (
                <div className="text-right">
                  <p className="text-sm text-stone-500 font-light">Principal ID</p>
                  <p className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-1 rounded">
                    {principal.substring(0, 8)}...{principal.substring(principal.length - 8)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => handleTabChange('personal')}
              className={tabClasses('personal')}
            >
              Personal Info
            </button>
            <button
              onClick={() => handleTabChange('medical')}
              className={tabClasses('medical')}
            >
              Medical History
            </button>
            <button
              onClick={() => handleTabChange('preferences')}
              className={tabClasses('preferences')}
            >
              Preferences
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="p-8">
                <h2 className="text-2xl font-light text-stone-800 font-serif mb-6">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-stone-700 font-light mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.personalInfo.name}
                      onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Age</label>
                    <input
                      type="number"
                      value={profile.personalInfo.age || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'age', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Your age"
                    />
                  </div>

                  {/* MODIFICATION START: Gender Dropdown */}
                  <div>
                    <label className="block text-stone-700 font-light mb-2">Gender</label>
                    <div className="relative">
                      <select
                        value={profile.personalInfo.gender}
                        onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                        className="w-full appearance-none bg-white px-4 py-3 pr-12 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* MODIFICATION END */}

                  {/* MODIFICATION START: Blood Type Dropdown */}
                  <div>
                    <label className="block text-stone-700 font-light mb-2">Blood Type</label>
                    <div className="relative">
                      <select
                        value={profile.personalInfo.bloodType}
                        onChange={(e) => handleInputChange('personalInfo', 'bloodType', e.target.value)}
                        className="w-full appearance-none bg-white px-4 py-3 pr-12 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* MODIFICATION END */}

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={profile.personalInfo.height || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'height', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Height in centimeters"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={profile.personalInfo.weight || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'weight', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Weight in kilograms"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.personalInfo.phoneNumber}
                      onChange={(e) => handleInputChange('personalInfo', 'phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Emergency Contact</label>
                    <input
                      type="text"
                      value={profile.personalInfo.emergencyContact}
                      onChange={(e) => handleInputChange('personalInfo', 'emergencyContact', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="Emergency contact person"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Medical History Tab */}
            {activeTab === 'medical' && (
              <div className="p-8">
                <h2 className="text-2xl font-light text-stone-800 font-serif mb-6">
                  Medical History
                </h2>
                
                <div className="space-y-8">
                  {/* Allergies */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">Allergies</label>
                    <textarea
                      value={profile.medicalHistory.allergies}
                      onChange={(e) => handleInputChange('medicalHistory', 'allergies', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="List any allergies (e.g., peanuts, shellfish, penicillin)"
                      rows={3}
                    />
                  </div>

                  {/* Medications */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">Current Medications</label>
                    <textarea
                      value={profile.medicalHistory.medications}
                      onChange={(e) => handleInputChange('medicalHistory', 'medications', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="List current medications with dosages (e.g., Ibuprofen 400mg, Metformin 500mg)"
                      rows={3}
                    />
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">Medical Conditions</label>
                    <textarea
                      value={profile.medicalHistory.conditions}
                      onChange={(e) => handleInputChange('medicalHistory', 'conditions', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="List any medical conditions (e.g., diabetes, hypertension, asthma)"
                      rows={3}
                    />
                  </div>

                  {/* Surgeries */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">Past Surgeries</label>
                    <textarea
                      value={profile.medicalHistory.surgeries}
                      onChange={(e) => handleInputChange('medicalHistory', 'surgeries', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="List any past surgeries with dates (e.g., Appendectomy 2020, Knee surgery 2019)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-8">
                <h2 className="text-2xl font-light text-stone-800 font-serif mb-6">
                  Preferences & Settings
                </h2>
                
                <div className="space-y-8">
                  {/* Preferred Providers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-stone-700 font-light mb-2">Preferred Doctor</label>
                      <input
                        type="text"
                        value={profile.preferences.preferredDoctor}
                        onChange={(e) => handleInputChange('preferences', 'preferredDoctor', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                        placeholder="Dr. Smith, Cardiology"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-light mb-2">Preferred Pharmacy</label>
                      <input
                        type="text"
                        value={profile.preferences.preferredPharmacy}
                        onChange={(e) => handleInputChange('preferences', 'preferredPharmacy', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                        placeholder="HealthPlus Pharmacy"
                      />
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferences.notificationSettings.medicationReminders}
                          onChange={(e) => handleInputChange('preferences', 'notificationSettings', {
                            ...profile.preferences.notificationSettings,
                            medicationReminders: e.target.checked
                          })}
                          className="mr-3 w-4 h-4 text-emerald-600 bg-stone-100 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="font-light text-stone-700">Medication reminders</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferences.notificationSettings.appointmentReminders}
                          onChange={(e) => handleInputChange('preferences', 'notificationSettings', {
                            ...profile.preferences.notificationSettings,
                            appointmentReminders: e.target.checked
                          })}
                          className="mr-3 w-4 h-4 text-emerald-600 bg-stone-100 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="font-light text-stone-700">Appointment reminders</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferences.notificationSettings.wellnessInsights}
                          onChange={(e) => handleInputChange('preferences', 'notificationSettings', {
                            ...profile.preferences.notificationSettings,
                            wellnessInsights: e.target.checked
                          })}
                          className="mr-3 w-4 h-4 text-emerald-600 bg-stone-100 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="font-light text-stone-700">AI wellness insights</span>
                      </label>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">Privacy Level</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="radio"
                          name="privacyLevel"
                          value="private"
                          checked={profile.preferences.privacyLevel === 'private'}
                          onChange={(e) => handleInputChange('preferences', 'privacyLevel', e.target.value)}
                          className="mr-3 w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-medium text-stone-700">Private</div>
                          <div className="text-sm text-stone-500 font-light">Your data is fully encrypted and only you can access it</div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="radio"
                          name="privacyLevel"
                          value="anonymous"
                          checked={profile.preferences.privacyLevel === 'anonymous'}
                          onChange={(e) => handleInputChange('preferences', 'privacyLevel', e.target.value)}
                          className="mr-3 w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-medium text-stone-700">Anonymous</div>
                          <div className="text-sm text-stone-500 font-light">Data is anonymized for research purposes</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 rounded-b-2xl">
              <div className="flex justify-end items-center">
              
                <button
                  onClick={handleSave}
                  disabled={isSaving || !validationState[activeTab]}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First-time user name modal */}
      {showNameModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-md w-full p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-light text-stone-800 font-serif mb-2">
                Welcome to Cura!
              </h2>
              <p className="text-stone-600 font-light">
                To get started, please tell us your name.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-stone-700 font-light mb-2">Your Name</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                placeholder="Enter your full name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSubmit();
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleNameSubmit}
                disabled={!tempName.trim() || isLoading}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Profile...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;