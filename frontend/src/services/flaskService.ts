// Flask API service layer for communicating with healthcare agents via uAgents

const API_BASE_URL = 'http://localhost:5000/api';

// API Response types
interface ApiResponse {
  response?: string;
  intent?: string;
  confidence?: number;
  request_id?: string;
  error?: string;
  message?: string;
}

// Chat with main HealthAgent
export const sendChatMessage = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
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

// Log wellness data
export const logWellnessData = async (wellnessData: any, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wellness/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...wellnessData,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in logWellnessData:', error);
    throw error;
  }
};

// Send wellness message
export const sendWellnessMessage = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wellness`, {
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
    console.error('Error in sendWellnessMessage:', error);
    throw error;
  }
};

// Send doctor booking request
export const sendDoctorRequest = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctor`, {
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
    console.error('Error in sendDoctorRequest:', error);
    throw error;
  }
};

// Send pharmacy query
export const sendPharmacyRequest = async (message: string, userId: string = 'frontend_user'): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacy`, {
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
    console.error('Error in sendPharmacyRequest:', error);
    throw error;
  }
};

// Check agent status
export const checkAgentStatus = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in checkAgentStatus:', error);
    throw error;
  }
};

// Check API health
export const checkApiHealth = async (): Promise<any> => {
  try {
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in checkApiHealth:', error);
    throw error;
  }
};