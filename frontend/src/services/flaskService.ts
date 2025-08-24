// Direct agent communication service - no Flask middleman needed!

const AGENT_BASE_URL = 'http://localhost:8000';

// Get canister ID from environment variables  
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';
const ICP_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:4943';

interface UploadedFile {
  file: File;
  dataUrl: string;
  type: 'image';
}

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
export const sendChatMessage = async (message: string, userId: string = 'frontend_user', uploadedFile: UploadedFile | null = null): Promise<ApiResponse> => {
  try {
    const requestBody: any = {
      message,
      user_id: userId,
    };

    if (uploadedFile) {
      requestBody.file = {
        content: uploadedFile.dataUrl ? uploadedFile.dataUrl.split(',')[1] : '',
        file_type: uploadedFile.type,
        file_name: uploadedFile.file.name,
        mime_type: uploadedFile.file.type,
      };
    }

    const response = await fetch(`${AGENT_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
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

// Log wellness data via wellness agent (same path as chat)
export const logWellnessData = async (wellnessData: any, userId: string): Promise<ApiResponse> => {
  try {
    console.log('Logging wellness data via wellness agent...');
    
    // Convert wellness data to natural language message for the agent
    const messageParts = [];
    if (wellnessData.sleep) messageParts.push(`I slept ${wellnessData.sleep} hours`);
    if (wellnessData.steps) messageParts.push(`walked ${wellnessData.steps} steps`);
    if (wellnessData.water || wellnessData.water_intake) messageParts.push(`drank ${wellnessData.water || wellnessData.water_intake} glasses of water`);
    if (wellnessData.mood) messageParts.push(`feeling ${wellnessData.mood}`);
    if (wellnessData.exercise && wellnessData.exercise.trim()) messageParts.push(`exercise: ${wellnessData.exercise}`);
    
    const message = messageParts.length > 0 
      ? `Today I ${messageParts.join(', ')}.`
      : "Wellness data logged";

    console.log('Sending wellness message to agent:', message);
    
    // Send directly to chat agent which will route to wellness.py
    const response = await sendChatMessage(message, userId);
    
    return {
      response: response.response || 'Wellness data logged successfully to blockchain',
      intent: 'wellness_log',
      confidence: 1.0,
      request_id: response.request_id || `wellness_${Date.now()}`,
      message: 'Data logged via wellness agent'
    };
    
  } catch (error) {
    console.error('Error in logWellnessData via wellness agent:', error);
    throw error;
  }
};

// Send wellness message (uses main chat)
export const sendWellnessMessage = async (message: string, userId: string): Promise<ApiResponse> => {
  return await sendChatMessage(message, userId);
};


// Send doctor booking request (uses main chat)
export const sendDoctorRequest = async (message: string, userId: string): Promise<ApiResponse> => {
  return await sendChatMessage(message, userId);
};

// Send pharmacy query (uses main chat)
export const sendPharmacyRequest = async (message: string, userId: string): Promise<ApiResponse> => {
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
export const fetchAppointments = async (userId: string): Promise<any> => {
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
export const fetchOrders = async (userId: string): Promise<any> => {
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
export const fetchWellnessData = async (userId: string, days: number = 7): Promise<any> => {
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
export const placeMedicineOrder = async (medicineId: string, quantity: number, userId: string): Promise<any> => {
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
export const cancelAppointment = async (appointmentId: string, userId: string): Promise<any> => {
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
export const cancelMedicineOrder = async (orderId: string, userId: string): Promise<any> => {
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

// Delete wellness data for a specific date
export const deleteWellnessData = async (date: string, userId: string): Promise<any> => {
  try {
    console.log(`Deleting wellness data for ${date} for user: ${userId}`);
    
    // Try direct canister HTTP request first (same pattern as other functions)
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/delete-wellness-log`;
    console.log('Trying canister URL:', canisterUrl);
    
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        date: date
      })
    });

    console.log('Delete wellness response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const result = await icpResponse.json();
      console.log('Delete result:', result);

      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.logged_data
        };
      } else {
        throw new Error(result.message || 'Failed to delete wellness data');
      }
    }
    
    console.warn('Canister delete response not ok:', icpResponse.status, icpResponse.statusText);
    
  } catch (error) {
    console.error('Error deleting wellness data from canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    console.log('Trying HTTP interface fallback for delete...');
    const response = await fetch(`${ICP_BASE_URL}/delete-wellness-log`, {
      method: 'POST',
      headers: {
        'Host': `${CANISTER_ID}.localhost`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        date: date
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('HTTP interface delete result:', result);

      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.logged_data
        };
      } else {
        throw new Error(result.message || 'Failed to delete wellness data');
      }
    }
    
  } catch (error) {
    console.error('Error with HTTP interface for delete:', error);
  }
  
  console.log('Delete wellness failed, returning error');
  return { success: false, message: 'Failed to delete wellness data' };
};

// Create medication reminder
export const createMedicationReminder = async (userId: string, medication: string, time: string) => {
  try {
    console.log('Creating medication reminder:', { userId, medication, time });

    // Try ICP canister first
    const canisterUrls = [
      `${ICP_BASE_URL}/api/v2/canister/${CANISTER_ID}/call`,
      `${ICP_BASE_URL}/?canisterId=${CANISTER_ID}`,
      `http://${CANISTER_ID}.localhost:4943/store-reminder`
    ];

    for (const url of canisterUrls) {
      try {
        const reminderData = {
          user_id: userId,
          medicine: medication,
          time: time,
          created_at: new Date().toISOString(),
          active: true
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Host': `${CANISTER_ID}.localhost`
          },
          body: JSON.stringify(reminderData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Reminder created successfully:', result);
          return { success: true, message: 'Medication reminder created successfully', data: result };
        }
      } catch (error) {
        console.log(`Failed to create reminder via ${url}:`, error);
      }
    }

    throw new Error('All canister endpoints failed');

  } catch (error) {
    console.error('Error creating medication reminder:', error);
    return { success: false, message: 'Failed to create medication reminder' };
  }
};

// Wellness insights service - using chat agent for AI insights
export const getWellnessInsights = async (userId: string, days: number = 7) => {
  const requestId = Date.now().toString();
  console.log(`🚀 getWellnessInsights called - Request ID: ${requestId}`);
  console.trace('Call stack:'); // This will show us where the call is coming from
  
  try {
    console.log(`Requesting AI wellness insights for ${days} days for user: ${userId}`);
    
    // First, try to call the health agent's wellness insights endpoint
    try {
      const response = await fetch(`${AGENT_BASE_URL}/api/wellness-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          user_id: userId,
          days: days
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Wellness insights response:', data);
        
        if (data.success) {
          return {
            success: true,
            insights: data.insights,
            summary: data.summary,
            message: data.message,
            recommendations: data.recommendations || []
          };
        } else {
          return {
            success: false,
            insights: data.insights || "No wellness data available for insights generation.",
            summary: "No data available",
            message: data.message || "Unable to generate insights",
            recommendations: []
          };
        }
      } else {
        console.warn('Health agent wellness insights failed:', response.status);
      }
    } catch (agentError) {
      console.warn('Health agent not available for insights:', agentError);
    }
    
    // Fallback: Use chat agent to generate insights
    console.log('Falling back to chat-based insights generation...');
    
    const chatResponse = await sendChatMessage(
      `Can you analyze my wellness data from the past ${days} days and provide personalized health insights and recommendations?`,
      userId
    );
    
    if (chatResponse.response) {
      return {
        success: true,
        insights: chatResponse.response,
        summary: `AI analysis of ${days} days of wellness data`,
        message: "Insights generated via health agent chat",
        recommendations: []
      };
    } else {
      return {
        success: false,
        insights: "Unable to generate wellness insights at the moment. Please ensure you have some wellness data logged and try again.",
        summary: "No insights available",
        message: "Chat agent could not generate insights",
        recommendations: []
      };
    }
    
  } catch (error) {
    console.error('Error fetching wellness insights:', error);
    return {
      success: false,
      insights: "Unable to generate wellness insights at the moment. Please check your connection and try again.",
      summary: "Error occurred",
      message: "Network or service error",
      recommendations: []
    };
  }
};

// Add doctor to canister
export const storeDoctor = async (doctorData: any): Promise<any> => {
  // Build payload matching Motoko DoctorForm
  const buildDoctorFormPayload = (data: any) => ({
    name: data.name || "",
    specialty: data.specialty || "",
    qualifications: data.qualifications || "",
    experience_years: Number(data.experience_years ?? data.experience ?? 0),
    rating: Number(data.rating ?? 0),
    available_days: Array.isArray(data.available_days) ? data.available_days : [],
    available_slots: Array.isArray(data.available_slots) ? data.available_slots : [],
    image_url: data.image_url || data.image || "",
    phone_number: data.phone_number || "",
    email: data.email || "",
    address: data.address || "",
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString()
  });

  try {
    const payload = buildDoctorFormPayload(doctorData);
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/store_doctor`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (icpResponse.ok) {
      return await icpResponse.json();
    }
    // Fallback
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/store_doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (httpResponse.ok) {
      return await httpResponse.json();
    }
    return { success: false, message: 'Failed to store doctor' };
  } catch (error) {
    console.error('Error storing doctor:', error);
    return { success: false, message: 'Error storing doctor' };
  }
};

// Add medicine to canister
export const storeMedicine = async (medicineData: any): Promise<any> => {
  try {
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/store_medicine`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(medicineData)
    });
    if (icpResponse.ok) {
      return await icpResponse.json();
    }
    // Fallback
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/store_medicine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(medicineData)
    });
    if (httpResponse.ok) {
      return await httpResponse.json();
    }
    return { success: false, message: 'Failed to store medicine' };
  } catch (error) {
    console.error('Error storing medicine:', error);
    return { success: false, message: 'Error storing medicine' };
  }
};

// Fetch user medication reminders from ICP backend
export const fetchMedicationReminders = async (userId: string): Promise<any> => {
  try {
    console.log('Fetching medication reminders for user:', userId);
    
    // Try direct canister HTTP request first
    const canisterUrl = `http://${CANISTER_ID}.localhost:4943/get-reminders`;
    const icpResponse = await fetch(canisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    console.log('Medication reminders response status:', icpResponse.status);
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Medication reminders data from backend:', data);
      return data.reminders || data || [];
    }
    
    console.warn('Medication reminders canister response not ok:', icpResponse.status);
    
  } catch (error) {
    console.error('Error fetching medication reminders from canister:', error);
  }
  
  // Fallback to HTTP interface
  try {
    const httpResponse = await fetch(`${ICP_BASE_URL}/${CANISTER_ID}/get-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log('HTTP medication reminders data:', data);
      return data.reminders || data || [];
    }
    
  } catch (error) {
    console.error('Error fetching medication reminders from HTTP interface:', error);
  }
  
  // Final fallback - try using chat agent to get medication reminders
  try {
    console.log('Trying chat agent fallback for medication reminders...');
    const chatResponse = await sendChatMessage(
      'Show me my current medication reminders and prescriptions', 
      userId
    );
    
    if (chatResponse.response) {
      // For now, return empty array since parsing chat response is complex
      // In the future, this could parse structured data from the chat response
      console.log('Chat response for medication reminders:', chatResponse.response);
    }
  } catch (error) {
    console.error('Chat agent fallback failed:', error);
  }
  
  console.log('All medication reminders fetch methods failed, returning empty array');
  return [];
};