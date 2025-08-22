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

// Log wellness data (converted to natural language)
export const logWellnessData = async (wellnessData: any, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    // Convert wellness data to natural language message
    const messageParts = [];
    if (wellnessData.sleep) messageParts.push(`I slept ${wellnessData.sleep} hours`);
    if (wellnessData.steps) messageParts.push(`walked ${wellnessData.steps} steps`);
    if (wellnessData.water) messageParts.push(`drank ${wellnessData.water} glasses of water`);
    if (wellnessData.mood) messageParts.push(`feeling ${wellnessData.mood}`);
    if (wellnessData.exercise && wellnessData.exercise.trim()) messageParts.push(`exercise: ${wellnessData.exercise}`);
    
    const message = messageParts.length > 0 
      ? `Today I ${messageParts.join(', ')}.`
      : "Wellness data logged";

    return await sendChatMessage(message, userId);
  } catch (error) {
    console.error('Error in logWellnessData:', error);
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

// Fetch wellness data from ICP backend
export const fetchWellnessData = async (userId: string = 'user123', days: number = 7): Promise<any> => {
  try {
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-wellness-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, days: days })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      return data || { logs: [], total_count: 0 };
    }
    
    return { logs: [], total_count: 0 };
  } catch (error) {
    console.error('Error fetching wellness data:', error);
    return { logs: [], total_count: 0 };
  }
};