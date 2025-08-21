import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import Navbar from './nav';

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
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
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
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
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
      allergies: [],
      medications: [],
      conditions: [],
      surgeries: []
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
    initAuth();
  }, []);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);

    const isAuthenticated = await client.isAuthenticated();
    if (isAuthenticated) {
      const identity = client.getIdentity();
      setPrincipal(identity.getPrincipal().toString());
      
      // Load saved profile from localStorage as a simple implementation
      const savedProfile = localStorage.getItem('healthProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
  };

  const handleInputChange = (section: keyof HealthProfile, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayAdd = (section: keyof HealthProfile, field: string, value: string) => {
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section] as any)[field], value.trim()]
      }
    }));
  };

  const handleArrayRemove = (section: keyof HealthProfile, field: string, index: number) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage as a simple implementation
      // In a real app, this would save to ICP canister
      localStorage.setItem('healthProfile', JSON.stringify(profile));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (you could add a toast notification here)
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const tabClasses = (tab: string) => 
    `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      activeTab === tab
        ? 'bg-emerald-600 text-white shadow-md'
        : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
    }`;

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
                  Health Profile
                </h1>
                <p className="text-stone-500 font-light mt-2">
                  Manage your personal health information securely on ICP
                </p>
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
              onClick={() => setActiveTab('personal')}
              className={tabClasses('personal')}
            >
              👤 Personal Info
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className={tabClasses('medical')}
            >
              🏥 Medical History
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={tabClasses('preferences')}
            >
              ⚙️ Preferences
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

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Gender</label>
                    <select
                      value={profile.personalInfo.gender}
                      onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-light mb-2">Blood Type</label>
                    <select
                      value={profile.personalInfo.bloodType}
                      onChange={(e) => handleInputChange('personalInfo', 'bloodType', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
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
                  </div>

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
                    <label className="block text-stone-700 font-light mb-3 text-lg">🚫 Allergies</label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.medicalHistory.allergies.map((allergy, index) => (
                          <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-light border border-red-200 flex items-center">
                            {allergy}
                            <button
                              onClick={() => handleArrayRemove('medicalHistory', 'allergies', index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add an allergy"
                          className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayAdd('medicalHistory', 'allergies', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medications */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">💊 Current Medications</label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.medicalHistory.medications.map((medication, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-light border border-blue-200 flex items-center">
                            {medication}
                            <button
                              onClick={() => handleArrayRemove('medicalHistory', 'medications', index)}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a medication"
                          className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayAdd('medicalHistory', 'medications', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">🏥 Medical Conditions</label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.medicalHistory.conditions.map((condition, index) => (
                          <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-light border border-orange-200 flex items-center">
                            {condition}
                            <button
                              onClick={() => handleArrayRemove('medicalHistory', 'conditions', index)}
                              className="ml-2 text-orange-500 hover:text-orange-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a medical condition"
                          className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayAdd('medicalHistory', 'conditions', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Surgeries */}
                  <div>
                    <label className="block text-stone-700 font-light mb-3 text-lg">🔪 Past Surgeries</label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profile.medicalHistory.surgeries.map((surgery, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-light border border-purple-200 flex items-center">
                            {surgery}
                            <button
                              onClick={() => handleArrayRemove('medicalHistory', 'surgeries', index)}
                              className="ml-2 text-purple-500 hover:text-purple-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a surgery"
                          className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleArrayAdd('medicalHistory', 'surgeries', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
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
                      <label className="block text-stone-700 font-light mb-2">👨‍⚕️ Preferred Doctor</label>
                      <input
                        type="text"
                        value={profile.preferences.preferredDoctor}
                        onChange={(e) => handleInputChange('preferences', 'preferredDoctor', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                        placeholder="Dr. Smith, Cardiology"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-light mb-2">💊 Preferred Pharmacy</label>
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
                    <h3 className="text-xl font-light text-stone-700 mb-4">🔔 Notification Preferences</h3>
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
                    <h3 className="text-xl font-light text-stone-700 mb-4">🔐 Privacy Level</h3>
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
                          <div className="font-medium text-stone-700">🔒 Private</div>
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
                          <div className="font-medium text-stone-700">👤 Anonymous</div>
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
              <div className="flex justify-between items-center">
                <p className="text-sm text-stone-500 font-light">
                  🔐 All data is securely stored on the ICP blockchain
                </p>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
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
    </div>
  );
};

export default Profile;