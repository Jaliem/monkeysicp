// Direct agent communication service - no Flask middleman needed!

const AGENT_BASE_URL = 'http://localhost:8000';

// Get canister ID from environment variables  
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';
const ICP_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:4943';

// API Response types
interface ApiResponse {
  response?: string;
  intent?: string;
  confidence?: number;
  request_id?: string;
  error?: string;
  message?: string;
}

// Chat directly with HealthAgent via REST API
export const sendChatMessage = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${AGENT_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    throw error;
  }
};

// All healthcare requests now go through the main chat endpoint
// The agent intelligently routes based on message content

// Log wellness data directly to ICP backend or via chat
export const logWellnessData = async (wellnessData: any, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    // Try direct ICP backend logging first
    console.log('Logging wellness data via ICP backend...');
    
    // Prepare data for ICP backend
    const apiData = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0], // Current date
      sleep: wellnessData.sleep || null,
      steps: wellnessData.steps || null,
      exercise: wellnessData.exercise || null,
      mood: wellnessData.mood || null,
      water_intake: wellnessData.water || wellnessData.water_intake || null
    };
    
    // Try canister HTTP interface first
    try {
      const canisterUrl = `http://${CANISTER_ID}.localhost:4943/add-wellness-log`;
      const canisterResponse = await fetch(canisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (canisterResponse.ok) {
        const data = await canisterResponse.json();
        console.log('Wellness data logged via canister:', data);
        
        return {
          response: 'Wellness data logged successfully to blockchain',
          intent: 'wellness_log',
          confidence: 1.0,
          request_id: `wellness_${Date.now()}`,
          message: data.message || 'Data logged successfully'
        };
      }
    } catch (error) {
      console.error('Canister wellness logging failed:', error);
    }
    
    // Try HTTP interface fallback
    try {
      const httpResponse = await fetch(`${ICP_BASE_URL}/add-wellness-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (httpResponse.ok) {
        const data = await httpResponse.json();
        console.log('Wellness data logged via HTTP interface:', data);
        
        return {
          response: 'Wellness data logged successfully to blockchain',
          intent: 'wellness_log',
          confidence: 1.0,
          request_id: `wellness_${Date.now()}`,
          message: data.message || 'Data logged successfully'
        };
      }
    } catch (error) {
      console.error('HTTP interface wellness logging failed:', error);
    }
    
    console.warn('Direct ICP wellness logging failed, falling back to chat...');
  } catch (error) {
    console.error('Error with direct ICP wellness logging:', error);
  }
  
  // Fallback: Convert wellness data to natural language message for chat
  try {
    const messageParts = [];
    if (wellnessData.sleep) messageParts.push(`I slept ${wellnessData.sleep} hours`);
    if (wellnessData.steps) messageParts.push(`walked ${wellnessData.steps} steps`);
    if (wellnessData.water || wellnessData.water_intake) messageParts.push(`drank ${wellnessData.water || wellnessData.water_intake} glasses of water`);
    if (wellnessData.mood) messageParts.push(`feeling ${wellnessData.mood}`);
    if (wellnessData.exercise && wellnessData.exercise.trim()) messageParts.push(`exercise: ${wellnessData.exercise}`);
    
    const message = messageParts.length > 0 
      ? `Today I ${messageParts.join(', ')}.`
      : "Wellness data logged";

    return await sendChatMessage(message, userId);
  } catch (error) {
    console.error('Error in logWellnessData fallback:', error);
    throw error;
  }
};

// Send wellness message (uses main chat)
export const sendWellnessMessage = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  return await sendChatMessage(message, userId);
};


// Send doctor booking request (uses main chat)
export const sendDoctorRequest = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  return await sendChatMessage(message, userId);
};

// Send pharmacy query (uses main chat)
export const sendPharmacyRequest = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  return await sendChatMessage(message, userId);
};

// Check agent health directly
export const checkAgentStatus = async (): Promise<any> => {
  try {
    const response = await fetch(`${AGENT_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Convert to expected format for compatibility
    return {
      health: result.communication_status === "online" ? "online" : "offline",
      doctor: result.communication_status === "online" ? "online" : "offline",
      pharmacy: result.communication_status === "online" ? "online" : "offline", 
      wellness: result.communication_status === "online" ? "online" : "offline",
      communication: "direct_rest_api"
    };
  } catch (error) {
    console.error('Error in checkAgentStatus:', error);
    return {
      health: "offline",
      doctor: "offline", 
      pharmacy: "offline",
      wellness: "offline",
      communication: "agent_not_running",
      suggestion: "Start your agent with: python agent.py"
    };
  }
};

// Legacy function for compatibility - now just checks agent health
export const checkApiHealth = async (): Promise<any> => {
  return await checkAgentStatus();
};

// Fetch doctors data from ICP backend using HTTP interface
export const fetchDoctors = async (specialty: string = "general"): Promise<any> => {
  try {
    console.log('Fetching doctors for specialty:', specialty);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-doctors-by-specialty`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ specialty })
    });
    
    console.log('Doctors response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Doctors data from backend:', data);
      return data.doctors || [];
    }
    
    console.warn('Canister HTTP response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error fetching doctors from canister HTTP interface:', error);
  }
  
  // Fallback: try the HTTP interface endpoint
  try {
    console.log('Trying HTTP interface fallback...');
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-doctors-by-specialty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ specialty })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface data:', data);
      return data.doctors || [];
    }
    
  } catch (error) {
    console.error('Error with HTTP interface:', error);
  }
  
  console.log('All backend methods failed, falling back to default doctors...');
  return getDefaultDoctors();
};

// Default doctors fallback for when backend is not available
const getDefaultDoctors = () => [
  {
    doctor_id: "card_001",
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    qualifications: "MD, FACC, FHRS",
    experience_years: 12,
    rating: 4.7,
    available_days: ["Tuesday", "Thursday"],
    available_slots: ["10:00", "13:00", "15:00"],
    image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
  },
  {
    doctor_id: "gp_001",
    name: "Dr. Michael Rodriguez",
    specialty: "General Practitioner",
    qualifications: "MD, AAFP",
    experience_years: 8,
    rating: 4.6,
    available_days: ["Monday", "Wednesday", "Friday"],
    available_slots: ["09:00", "11:00", "14:00", "16:00"],
    image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
  }
];


// Fetch user appointments from ICP backend
export const fetchAppointments = async (userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Fetching appointments for user:', userId);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-user-appointments`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    console.log('Appointments response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Appointments data from backend:', data);
      return data || [];
    }
    
    console.warn('Appointments canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error fetching appointments from canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-user-appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP appointments data:', data);
      return data || [];
    }
    
  } catch (error) {
    console.error('Error fetching appointments from HTTP interface:', error);
  }
  
  console.log('Appointments fetch failed, returning empty array');
  return [];
};

// Fetch medicines from ICP backend
export const fetchMedicines = async (): Promise<any> => {
  try {
    console.log('Fetching medicines from backend...');
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-available-medicines`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Medicines response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Medicines data from backend:', data);
      return data.medicines || [];
    }
    
    console.warn('Canister medicines response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error fetching medicines from canister HTTP interface:', error);
  }
  
  // Fallback: try the HTTP interface endpoint
  try {
    console.log('Trying medicines HTTP interface fallback...');
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-available-medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface medicines data:', data);
      return data.medicines || [];
    }
    
  } catch (error) {
    console.error('Error with medicines HTTP interface:', error);
  }
  
  console.log('All backend methods failed for medicines, falling back to default...');
  return getDefaultMedicines();
};

// Default medicines fallback for when backend is not available
const getDefaultMedicines = () => [
  {
    medicine_id: "med_001",
    name: "Paracetamol",
    generic_name: "Acetaminophen",
    category: "Pain Relief",
    stock: 150,
    price: 5.99,
    manufacturer: "PharmaCorp",
    description: "Effective pain reliever and fever reducer",
    requires_prescription: false,
    active_ingredient: "Acetaminophen 500mg",
    dosage: "1-2 tablets every 4-6 hours"
  },
  {
    medicine_id: "med_002",
    name: "Ibuprofen",
    generic_name: "Ibuprofen",
    category: "Pain Relief",
    stock: 120,
    price: 7.50,
    manufacturer: "HealthPlus",
    description: "Anti-inflammatory pain reliever",
    requires_prescription: false,
    active_ingredient: "Ibuprofen 400mg",
    dosage: "1 tablet every 6-8 hours"
  }
];

// Fetch user orders from ICP backend
export const fetchOrders = async (userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Fetching orders for user:', userId);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-user-medicine-orders`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Orders data from backend:', data);
      return data || [];
    }
    
    console.warn('Orders canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error fetching orders from canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-user-medicine-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      return data || [];
    }
    
  } catch (error) {
    console.error('Error fetching orders from HTTP interface:', error);
  }
  
  console.log('Orders fetch failed, returning empty array');
  return [];
};

// Fetch wellness data from ICP backend (same pattern as other services)
export const fetchWellnessData = async (userId: string = 'user123', days: number = 7): Promise<any> => {
  try {
    console.log('Fetching wellness data for user:', userId);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-wellness-summary`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, days: days })
    });
    
    console.log('Wellness response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Wellness data from backend:', data);
      return data || { logs: [], total_count: 0 };
    }
    
    console.warn('Canister wellness response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error fetching wellness data from canister HTTP interface:', error);
  }
  
  // Fallback: try the HTTP interface endpoint
  try {
    console.log('Trying wellness HTTP interface fallback...');
    const httpResponse = await fetch(`${ICP_BASE_URL}/get-wellness-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, days: days })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface wellness data:', data);
      return data || { logs: [], total_count: 0 };
    }
    
  } catch (error) {
    console.error('Error with wellness HTTP interface:', error);
  }
  
  console.log('All backend methods failed for wellness, returning empty...');
  return { logs: [], total_count: 0 };
};

// Store user profile to ICP backend
export const storeUserProfile = async (profile: any, userId: string): Promise<any> => {
  console.log('Storing user profile for user:', userId);
  
  // Convert frontend profile format to ICP backend format
  const icpProfile = {
    user_id: userId,
    name: profile.personalInfo?.name || '',
    age: profile.personalInfo?.age || 0,
    gender: profile.personalInfo?.gender || '',
    height: profile.personalInfo?.height || 0,
    weight: profile.personalInfo?.weight || 0,
    blood_type: profile.personalInfo?.bloodType || '',
    phone_number: profile.personalInfo?.phoneNumber || '',
    emergency_contact: profile.personalInfo?.emergencyContact || '',
    allergies: profile.medicalHistory?.allergies || '',
    medications: profile.medicalHistory?.medications || '',
    conditions: profile.medicalHistory?.conditions || '',
    surgeries: profile.medicalHistory?.surgeries || '',
    preferred_doctor: profile.preferences?.preferredDoctor || '',
    preferred_pharmacy: profile.preferences?.preferredPharmacy || '',
    privacy_level: profile.preferences?.privacyLevel || 'private',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/store-user-profile`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(icpProfile)
    });
    
    console.log('Store profile response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Profile stored successfully:', data);
      return data;
    }
    
    console.warn('Canister profile store response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error storing user profile to canister:', error);
  }
  
  // Fallback: try the HTTP interface endpoint
  try {
    console.log('Trying HTTP interface fallback for profile store...');
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/store-user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(icpProfile)
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface profile store data:', data);
      return data;
    }
    
  } catch (error) {
    console.error('Error with HTTP interface for profile store:', error);
  }
  
  console.log('Profile store failed, returning error');
  return { success: false, message: 'Failed to store user profile' };
};

// Profile field mapping for numerical keys from ICP backend
const PROFILE_KEY_MAPPING = {
  '1_224_700_491': 'name',           // "Vellyn Angeline"
  '4_846_783': 'age',               // 19
  '2_671_539_009': 'gender',        // "female"
  '38_537_191': 'height',           // 168
  '27_685_240': 'weight',           // 54
  '1_792_167_071': 'blood_type',    // "AB+"
  '3_066_505_586': 'phone_number',  // "2222222"
  '3_271_114_426': 'emergency_contact', // "1111111"
  '2_243_232_132': 'allergies',     // []
  '2_973_269_624': 'medications',   // []
  '3_823_999_454': 'conditions',    // []
  '217_337_491': 'surgeries',       // []
  '827_030_941': 'preferred_doctor', // ""
  '1_337_989_745': 'preferred_pharmacy', // ""
  '1_793_941_773': 'privacy_level', // "private"
  '1_779_848_746': 'created_at',    // "2025-08-23T04:18:52.304Z"
  '272_465_847': 'updated_at',      // "2025-08-23T04:18:52.304Z"
  '1_869_947_023': 'user_id'        // Principal ID
};

// Helper function to convert numerical keys to readable format
const convertNumericalProfile = (numericalProfile: any) => {
  const converted: any = {};
  
  // Map numerical keys to readable field names
  Object.keys(numericalProfile).forEach(key => {
    const mappedKey = PROFILE_KEY_MAPPING[key as keyof typeof PROFILE_KEY_MAPPING];
    if (mappedKey) {
      converted[mappedKey] = numericalProfile[key];
    }
  });
  
  return converted;
};

// Fetch user profile from ICP backend
export const fetchUserProfile = async (userId: string): Promise<any> => {
  try {
    console.log('Fetching user profile for user:', userId);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-user-profile`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    console.log('Fetch profile response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Profile fetched successfully:', data);
      
      // Handle different response formats
      let icpProfile = data.profile || data;
      
      // Check if profile has numerical keys and convert them
      if (icpProfile && typeof icpProfile === 'object') {
        const hasNumericalKeys = Object.keys(icpProfile).some(key => /^\d+_\d+/.test(key));
        if (hasNumericalKeys) {
          console.log('Converting numerical profile keys...');
          icpProfile = convertNumericalProfile(icpProfile);
        }
      }
      
      // Convert ICP backend format to frontend format
      if (icpProfile && (data.success !== false)) {
        return {
          success: true,
          profile: {
            personalInfo: {
              name: icpProfile.name || '',
              age: icpProfile.age || 0,
              gender: icpProfile.gender || '',
              height: icpProfile.height || 0,
              weight: icpProfile.weight || 0,
              bloodType: icpProfile.blood_type || '',
              phoneNumber: icpProfile.phone_number || '',
              emergencyContact: icpProfile.emergency_contact || ''
            },
            medicalHistory: {
              allergies: icpProfile.allergies || '',
              medications: icpProfile.medications || '',
              conditions: icpProfile.conditions || '',
              surgeries: icpProfile.surgeries || ''
            },
            preferences: {
              preferredDoctor: icpProfile.preferred_doctor || '',
              preferredPharmacy: icpProfile.preferred_pharmacy || '',
              privacyLevel: icpProfile.privacy_level || 'private',
              notificationSettings: {
                medicationReminders: true,
                appointmentReminders: true,
                wellnessInsights: true
              }
            }
          }
        };
      }
      
      return data;
    }
    
    console.warn('Canister profile fetch response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error fetching user profile from canister:', error);
  }
  
  // Fallback: try the HTTP interface endpoint
  try {
    console.log('Trying HTTP interface fallback for profile fetch...');
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface profile fetch data:', data);
      
      // Handle different response formats
      let icpProfile = data.profile || data;
      
      // Check if profile has numerical keys and convert them
      if (icpProfile && typeof icpProfile === 'object') {
        const hasNumericalKeys = Object.keys(icpProfile).some(key => /^\d+_\d+/.test(key));
        if (hasNumericalKeys) {
          console.log('Converting numerical profile keys...');
          icpProfile = convertNumericalProfile(icpProfile);
        }
      }
      
      // Convert ICP backend format to frontend format
      if (icpProfile && (data.success !== false)) {
        return {
          success: true,
          profile: {
            personalInfo: {
              name: icpProfile.name || '',
              age: icpProfile.age || 0,
              gender: icpProfile.gender || '',
              height: icpProfile.height || 0,
              weight: icpProfile.weight || 0,
              bloodType: icpProfile.blood_type || '',
              phoneNumber: icpProfile.phone_number || '',
              emergencyContact: icpProfile.emergency_contact || ''
            },
            medicalHistory: {
              allergies: icpProfile.allergies || '',
              medications: icpProfile.medications || '',
              conditions: icpProfile.conditions || '',
              surgeries: icpProfile.surgeries || ''
            },
            preferences: {
              preferredDoctor: icpProfile.preferred_doctor || '',
              preferredPharmacy: icpProfile.preferred_pharmacy || '',
              privacyLevel: icpProfile.privacy_level || 'private',
              notificationSettings: {
                medicationReminders: true,
                appointmentReminders: true,
                wellnessInsights: true
              }
            }
          }
        };
      }
      
      return data;
    }
    
  } catch (error) {
    console.error('Error with HTTP interface for profile fetch:', error);
  }
  
  console.log('Profile fetch failed, returning null');
  return { success: false, message: 'User profile not found', profile: null };
};

// Place medicine order to ICP backend
export const placeMedicineOrder = async (medicineId: string, quantity: number, userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Placing medicine order:', { medicineId, quantity, userId });
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/place-medicine-order`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        medicine_id: medicineId, 
        quantity: quantity,
        user_id: userId
      })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Order placement response from backend:', data);
      return data;
    }
    
    console.warn('Order placement canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error placing order to canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/place-medicine-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        medicine_id: medicineId, 
        quantity: quantity,
        user_id: userId
      })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP interface order placement data:', data);
      return data;
    }
    
  } catch (error) {
    console.error('Error placing order via HTTP interface:', error);
  }
  
  return { success: false, message: 'Failed to place order' };
};

// Cancel doctor appointment
export const cancelAppointment = async (appointmentId: string, userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Cancelling appointment:', { appointmentId, userId });
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/cancel-appointment`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        appointment_id: appointmentId,
        user_id: userId
      })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Appointment cancellation response from backend:', data);
      return data;
    }
    
    console.warn('Appointment cancellation canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error cancelling appointment to canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/cancel-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        appointment_id: appointmentId,
        user_id: userId
      })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('Appointment cancellation via HTTP interface:', data);
      return data;
    }
    
    console.warn('HTTP interface appointment cancellation failed:', httpResponse.status);
    
  } catch (error) {
    console.error('Error cancelling appointment via HTTP interface:', error);
  }
  
  // Return default error response
  return {
    success: false,
    message: 'Failed to cancel appointment: Unable to connect to backend services',
    cancelled_id: null
  };
};

// Cancel medicine order
export const cancelMedicineOrder = async (orderId: string, userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Cancelling medicine order:', { orderId, userId });
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/cancel-medicine-order`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        order_id: orderId,
        user_id: userId
      })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Order cancellation response from backend:', data);
      return data;
    }
    
    console.warn('Order cancellation canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error cancelling order to canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/cancel-medicine-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        order_id: orderId,
        user_id: userId
      })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('Order cancellation via HTTP interface:', data);
      return data;
    }
    
    console.warn('HTTP interface order cancellation failed:', httpResponse.status);
    
  } catch (error) {
    console.error('Error cancelling order via HTTP interface:', error);
  }
  
  // Return default error response
  return {
    success: false,
    message: 'Failed to cancel order: Unable to connect to backend services',
    cancelled_id: null
  };
};