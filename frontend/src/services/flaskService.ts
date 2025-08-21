// Direct agent communication service - no Flask middleman needed!

const AGENT_BASE_URL = 'http://localhost:8000';

// Get canister ID from environment variables
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID || import.meta.env.VITE_CANISTER_ID_BACKEND || 'uxrrr-q7777-77774-qaaaq-cai';
const ICP_BASE_URL = `http://${CANISTER_ID}.localhost:4943`;

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
    if (wellnessData.exercise) messageParts.push(`exercise: ${wellnessData.exercise}`);
    
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

// Fetch doctors data from ICP backend
export const fetchDoctors = async (): Promise<any> => {
  try {
    // Fetch all doctors by searching for "general" (which matches all specialties per the backend logic)
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-doctors-by-specialty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ specialty: "general" })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      return data.doctors || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

// Fetch user appointments from ICP backend
export const fetchAppointments = async (userId: string = 'user123'): Promise<any> => {
  try {
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-user-appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      return data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Fetch medicines from ICP backend
export const fetchMedicines = async (): Promise<any> => {
  try {
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-available-medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      return data.medicines || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return [];
  }
};

// Fetch user orders from ICP backend
export const fetchOrders = async (userId: string = 'user123'): Promise<any> => {
  try {
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-user-medicine-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      return data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
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