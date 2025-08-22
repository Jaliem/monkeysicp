// Direct agent communication service - no Flask middleman needed!

const AGENT_BASE_URL = 'http://localhost:8000';

// Get canister ID from environment variables
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID || import.meta.env.VITE_CANISTER_ID_BACKEND || 'ucwa4-rx777-77774-qaada-cai';
const ICP_BASE_URL = `http://127.0.0.1:4943`;

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

// Fetch doctors data from ICP backend using direct dfx approach
export const fetchDoctors = async (specialty: string = "general"): Promise<any> => {
  try {
    console.log('Fetching doctors for specialty:', specialty);
    
    // For now, return mock data that matches the backend structure until we can fix the HTTP interface
    // This simulates what the backend would return based on our dfx call results
    const mockDoctors = await generateMockDoctorsData(specialty);
    
    console.log('Mock doctors data generated for specialty', specialty, '- total doctors:', mockDoctors.length);
    return mockDoctors;
    
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

// Generate mock data that matches the backend structure
const generateMockDoctorsData = async (specialty: string): Promise<any[]> => {
  // This data matches what we saw in the dfx call output - all 45 doctors
  const allDoctors = [
    // Cardiology (6 doctors)
    {
      doctor_id: "card_001",
      name: "Dr. Amir Hassan",
      specialty: "Cardiology",
      qualifications: "MD, FACC",
      experience_years: 15,
      rating: 4.8,
      available_days: ["Monday", "Wednesday", "Friday"],
      available_slots: ["09:00", "11:00", "14:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "card_002",
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
      doctor_id: "card_003",
      name: "Dr. Priya Sharma",
      specialty: "Cardiology",
      qualifications: "MD, FACC, FSCAI",
      experience_years: 18,
      rating: 4.9,
      available_days: ["Monday", "Thursday", "Saturday"],
      available_slots: ["08:00", "12:00", "15:00", "17:00"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "card_004",
      name: "Dr. James Mitchell",
      specialty: "Cardiology",
      qualifications: "MD, FACC, FACS",
      experience_years: 20,
      rating: 4.6,
      available_days: ["Tuesday", "Friday"],
      available_slots: ["09:30", "11:30", "14:30", "16:30"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "card_005",
      name: "Dr. Fatima Al-Zahra",
      specialty: "Cardiology",
      qualifications: "MD, FACC",
      experience_years: 14,
      rating: 4.8,
      available_days: ["Wednesday", "Friday", "Saturday"],
      available_slots: ["08:30", "10:30", "13:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "card_006",
      name: "Dr. Robert Kim",
      specialty: "Cardiology",
      qualifications: "MD, FACC, FHRS",
      experience_years: 16,
      rating: 4.7,
      available_days: ["Monday", "Tuesday"],
      available_slots: ["09:00", "11:00", "14:00"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    // Dermatology (5 doctors)
    {
      doctor_id: "derm_001",
      name: "Dr. Bella Rodriguez",
      specialty: "Dermatology",
      qualifications: "MD, FAAD",
      experience_years: 10,
      rating: 4.6,
      available_days: ["Monday", "Tuesday", "Thursday"],
      available_slots: ["08:00", "10:00", "14:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "derm_002",
      name: "Dr. Sofia Petrov",
      specialty: "Dermatology",
      qualifications: "MD, FAAD, FACMS",
      experience_years: 17,
      rating: 4.9,
      available_days: ["Wednesday", "Friday"],
      available_slots: ["09:00", "11:00", "13:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "derm_003",
      name: "Dr. Ahmed Al-Rashid",
      specialty: "Dermatology",
      qualifications: "MD, FAAD",
      experience_years: 9,
      rating: 4.5,
      available_days: ["Tuesday", "Thursday", "Saturday"],
      available_slots: ["08:30", "10:30", "14:30"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "derm_004",
      name: "Dr. Emma Thompson",
      specialty: "Dermatology",
      qualifications: "MD, FAAD, FACMS",
      experience_years: 13,
      rating: 4.8,
      available_days: ["Monday", "Wednesday"],
      available_slots: ["09:30", "11:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "derm_005",
      name: "Dr. Marcus Johnson",
      specialty: "Dermatology",
      qualifications: "MD, FAAD",
      experience_years: 15,
      rating: 4.7,
      available_days: ["Tuesday", "Friday"],
      available_slots: ["08:00", "12:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    // Neurology (5 doctors)
    {
      doctor_id: "neuro_001",
      name: "Dr. Chen Wang",
      specialty: "Neurology",
      qualifications: "MD, FAAN",
      experience_years: 18,
      rating: 4.9,
      available_days: ["Wednesday", "Friday"],
      available_slots: ["09:00", "13:00", "15:00", "17:00"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "neuro_002",
      name: "Dr. Isabella Romano",
      specialty: "Neurology",
      qualifications: "MD, FAAN, FAES",
      experience_years: 22,
      rating: 4.9,
      available_days: ["Monday", "Tuesday"],
      available_slots: ["10:00", "14:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "neuro_003",
      name: "Dr. David Kim",
      specialty: "Neurology",
      qualifications: "MD, FAAN",
      experience_years: 11,
      rating: 4.7,
      available_days: ["Thursday", "Friday", "Saturday"],
      available_slots: ["09:00", "11:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "neuro_004",
      name: "Dr. Maria Gonzalez",
      specialty: "Neurology",
      qualifications: "MD, FAAN, FAES",
      experience_years: 19,
      rating: 4.8,
      available_days: ["Monday", "Wednesday"],
      available_slots: ["08:30", "12:30", "16:30"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "neuro_005",
      name: "Dr. Andrew Foster",
      specialty: "Neurology",
      qualifications: "MD, FAAN",
      experience_years: 14,
      rating: 4.6,
      available_days: ["Tuesday", "Thursday"],
      available_slots: ["10:30", "13:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    // Orthopedics (5 doctors)
    {
      doctor_id: "ortho_001",
      name: "Dr. Miguel Diaz",
      specialty: "Orthopedics",
      qualifications: "MD, FAAOS",
      experience_years: 14,
      rating: 4.5,
      available_days: ["Monday", "Wednesday"],
      available_slots: ["09:30", "16:00", "18:00"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "ortho_002",
      name: "Dr. Lisa Thompson",
      specialty: "Orthopedics",
      qualifications: "MD, FAAOS",
      experience_years: 17,
      rating: 4.8,
      available_days: ["Tuesday", "Thursday"],
      available_slots: ["08:00", "10:00", "14:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "ortho_003",
      name: "Dr. Carlos Mendez",
      specialty: "Orthopedics",
      qualifications: "MD, FAAOS, FACS",
      experience_years: 19,
      rating: 4.6,
      available_days: ["Monday", "Wednesday", "Friday"],
      available_slots: ["09:00", "13:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "ortho_004",
      name: "Dr. Jennifer Park",
      specialty: "Orthopedics",
      qualifications: "MD, FAAOS",
      experience_years: 12,
      rating: 4.7,
      available_days: ["Tuesday", "Friday"],
      available_slots: ["08:30", "11:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "ortho_005",
      name: "Dr. Viktor Petrov",
      specialty: "Orthopedics",
      qualifications: "MD, FAAOS, FACS",
      experience_years: 21,
      rating: 4.9,
      available_days: ["Wednesday", "Thursday", "Saturday"],
      available_slots: ["09:00", "12:00", "14:00"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    // Pediatrics (6 doctors)
    {
      doctor_id: "pedia_001",
      name: "Dr. Emily Johnson",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP",
      experience_years: 8,
      rating: 4.8,
      available_days: ["Tuesday", "Thursday", "Saturday"],
      available_slots: ["08:00", "12:00", "14:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "pedia_002",
      name: "Dr. Rachel Green",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP",
      experience_years: 12,
      rating: 4.7,
      available_days: ["Monday", "Wednesday", "Friday"],
      available_slots: ["08:30", "10:30", "13:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "pedia_003",
      name: "Dr. Yuki Yamamoto",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP, FPIDS",
      experience_years: 15,
      rating: 4.9,
      available_days: ["Tuesday", "Thursday"],
      available_slots: ["09:00", "12:00", "14:00"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "pedia_004",
      name: "Dr. Hannah Miller",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP",
      experience_years: 10,
      rating: 4.6,
      available_days: ["Monday", "Friday"],
      available_slots: ["08:00", "11:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "pedia_005",
      name: "Dr. Omar Hassan",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP, FPEM",
      experience_years: 18,
      rating: 4.8,
      available_days: ["Wednesday", "Saturday"],
      available_slots: ["09:30", "11:30", "13:30"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "pedia_006",
      name: "Dr. Sophie Laurent",
      specialty: "Pediatrics",
      qualifications: "MD, FAAP",
      experience_years: 7,
      rating: 4.5,
      available_days: ["Tuesday", "Thursday", "Friday"],
      available_slots: ["08:30", "12:30", "16:30"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    // Psychiatry (5 doctors)
    {
      doctor_id: "psych_001",
      name: "Dr. Grace Liu",
      specialty: "Psychiatry",
      qualifications: "MD, FAPA",
      experience_years: 11,
      rating: 4.6,
      available_days: ["Tuesday", "Thursday"],
      available_slots: ["09:15", "11:15", "13:15"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "psych_002",
      name: "Dr. Michael Foster",
      specialty: "Psychiatry",
      qualifications: "MD, FAPA",
      experience_years: 16,
      rating: 4.8,
      available_days: ["Monday", "Wednesday"],
      available_slots: ["10:00", "12:00", "14:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "psych_003",
      name: "Dr. Nina Volkov",
      specialty: "Psychiatry",
      qualifications: "MD, FAPA, FACEP",
      experience_years: 13,
      rating: 4.5,
      available_days: ["Tuesday", "Friday"],
      available_slots: ["09:30", "11:30", "13:30"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "psych_004",
      name: "Dr. Samuel Wright",
      specialty: "Psychiatry",
      qualifications: "MD, FAPA",
      experience_years: 19,
      rating: 4.9,
      available_days: ["Monday", "Thursday"],
      available_slots: ["08:00", "10:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "psych_005",
      name: "Dr. Amara Patel",
      specialty: "Psychiatry",
      qualifications: "MD, FAPA, FAACAP",
      experience_years: 14,
      rating: 4.7,
      available_days: ["Wednesday", "Friday", "Saturday"],
      available_slots: ["09:00", "13:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    // Oncology (5 doctors)
    {
      doctor_id: "onco_001",
      name: "Dr. Faisal Ahmad",
      specialty: "Oncology",
      qualifications: "MD, FACP",
      experience_years: 20,
      rating: 4.7,
      available_days: ["Monday", "Wednesday", "Friday"],
      available_slots: ["10:30", "13:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "onco_002",
      name: "Dr. Catherine Brooks",
      specialty: "Oncology",
      qualifications: "MD, FACP, FASCO",
      experience_years: 17,
      rating: 4.8,
      available_days: ["Tuesday", "Thursday"],
      available_slots: ["09:00", "12:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "onco_003",
      name: "Dr. Rajesh Kumar",
      specialty: "Oncology",
      qualifications: "MD, FACP",
      experience_years: 22,
      rating: 4.9,
      available_days: ["Monday", "Thursday"],
      available_slots: ["08:30", "11:30", "14:30"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "onco_004",
      name: "Dr. Elena Rossi",
      specialty: "Oncology",
      qualifications: "MD, FACP, FASCO",
      experience_years: 15,
      rating: 4.6,
      available_days: ["Wednesday", "Friday"],
      available_slots: ["10:00", "13:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "onco_005",
      name: "Dr. Jonathan Davis",
      specialty: "Oncology",
      qualifications: "MD, FACP",
      experience_years: 18,
      rating: 4.8,
      available_days: ["Tuesday", "Saturday"],
      available_slots: ["09:30", "12:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    // General Practitioner (8 doctors)
    {
      doctor_id: "gp_001",
      name: "Dr. Hiro Tanaka",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP",
      experience_years: 7,
      rating: 4.4,
      available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      available_slots: ["08:30", "10:30", "12:30", "14:30"],
      image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_002",
      name: "Dr. Sarah Williams",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP",
      experience_years: 10,
      rating: 4.6,
      available_days: ["Monday", "Tuesday", "Thursday"],
      available_slots: ["08:00", "11:00", "13:00", "16:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_003",
      name: "Dr. Robert Clarke",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP, ABFM",
      experience_years: 14,
      rating: 4.7,
      available_days: ["Wednesday", "Friday"],
      available_slots: ["09:00", "11:30", "14:30"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_004",
      name: "Dr. Angela Martinez",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP",
      experience_years: 12,
      rating: 4.5,
      available_days: ["Monday", "Wednesday", "Friday"],
      available_slots: ["08:00", "10:00", "15:00", "17:00"],
      image_url: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_005",
      name: "Dr. Thomas Anderson",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP, ABFM",
      experience_years: 16,
      rating: 4.8,
      available_days: ["Tuesday", "Thursday", "Saturday"],
      available_slots: ["09:30", "12:00", "14:00"],
      image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_006",
      name: "Dr. Priyanka Singh",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP",
      experience_years: 9,
      rating: 4.6,
      available_days: ["Monday", "Tuesday", "Friday"],
      available_slots: ["08:30", "11:30", "13:30", "16:30"],
      image_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_007",
      name: "Dr. Kevin O'Brien",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP",
      experience_years: 11,
      rating: 4.4,
      available_days: ["Wednesday", "Thursday", "Saturday"],
      available_slots: ["09:00", "12:30", "15:30"],
      image_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face"
    },
    {
      doctor_id: "gp_008",
      name: "Dr. Fatima Nasser",
      specialty: "General Practitioner",
      qualifications: "MD, AAFP, ABFM",
      experience_years: 13,
      rating: 4.7,
      available_days: ["Monday", "Thursday"],
      available_slots: ["08:00", "10:30", "13:00", "15:00"],
      image_url: "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face"
    }
  ];

  if (specialty === "general") {
    return allDoctors;
  }
  
  return allDoctors.filter(doctor => 
    doctor.specialty.toLowerCase() === specialty.toLowerCase() ||
    (specialty === "general-practitioner" && doctor.specialty === "General Practitioner")
  );
};

// Fetch user appointments from ICP backend
export const fetchAppointments = async (userId: string = 'user123'): Promise<any> => {
  try {
    console.log('Fetching appointments from:', `${ICP_BASE_URL}/get-user-appointments`);
    
    const icpResponse = await fetch(`${ICP_BASE_URL}/get-user-appointments?canisterId=${CANISTER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId }),
      mode: 'cors' // Explicitly set CORS mode
    });
    
    console.log('Appointments response status:', icpResponse.status);
    console.log('Appointments response headers:', Object.fromEntries(icpResponse.headers.entries()));
    
    if (icpResponse.ok) {
      const data = await icpResponse.json();
      console.log('Appointments data:', data);
      return data || [];
    }
    
    console.warn('Appointments response not ok:', icpResponse.status, icpResponse.statusText);
    return [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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