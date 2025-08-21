import { AuthClient } from '@dfinity/auth-client';

const CANISTER_URL = import.meta.env.VITE_CANISTER_URL || 'http://127.0.0.1:4943';
const BACKEND_CANISTER_ID = import.meta.env.VITE_BACKEND_CANISTER_ID || 'be2us-64aaa-aaaaa-qaabq-cai';

export interface SymptomData {
  user_id: string;
  symptoms: string[];
  timestamp: string;
}

export interface WellnessLog {
  user_id: string;
  date: string;
  sleep: string;
  steps: number;
  exercise: string;
  mood: string;
  water_intake: number;
}

export interface MedicationReminder {
  user_id: string;
  medicine: string;
  time: string;
  created_at: string;
  active: boolean;
}

export interface HealthStorageResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface WellnessStoreResponse {
  success: boolean;
  message: string;
  id?: string;
  logged_data?: WellnessLog;
}

class HealthService {
  private canisterUrl: string;

  constructor() {
    this.canisterUrl = `${CANISTER_URL}/?canisterId=${BACKEND_CANISTER_ID}`;
  }

  private async getAuthenticatedIdentity() {
    const authClient = await AuthClient.create();
    return authClient.getIdentity();
  }

  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this.canisterUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw error;
    }
  }

  async storeSymptoms(symptoms: string[], userId: string): Promise<HealthStorageResponse> {
    const symptomData: SymptomData = {
      user_id: userId,
      symptoms: symptoms,
      timestamp: Date.now().toString()
    };

    return this.makeRequest('/store-symptoms', symptomData);
  }

  async storeWellnessLog(wellnessLog: WellnessLog): Promise<WellnessStoreResponse> {
    return this.makeRequest('/add-wellness-log', wellnessLog);
  }

  async storeMedicationReminder(medicine: string, time: string, userId: string): Promise<HealthStorageResponse> {
    const reminderData: MedicationReminder = {
      user_id: userId,
      medicine: medicine,
      time: time,
      created_at: Date.now().toString(),
      active: true
    };

    return this.makeRequest('/store-reminder', reminderData);
  }

  async getSymptomHistory(userId: string) {
    return this.makeRequest('/get-symptom-history', { user_id: userId });
  }

  async getWellnessSummary(userId: string, days: number = 7) {
    return this.makeRequest('/get-wellness-summary', { user_id: userId });
  }

  async getReminders(userId: string) {
    return this.makeRequest('/get-reminders', { user_id: userId });
  }

  async searchDoctorsBySpecialty(specialty: string) {
    return this.makeRequest('/get-doctors-by-specialty', { specialty: specialty });
  }

  async searchMedicinesByName(medicineName: string) {
    return this.makeRequest('/search-medicines-by-name', { medicine_name: medicineName });
  }

  async searchMedicinesByCategory(category: string) {
    return this.makeRequest('/search-medicines-by-category', { category: category });
  }

  async getAvailableMedicines() {
    return this.makeRequest('/get-available-medicines', {});
  }

  async placeMedicineOrder(medicineId: string, quantity: number, userId: string, prescriptionId?: string) {
    const orderData = {
      medicine_id: medicineId,
      quantity: quantity,
      user_id: userId,
      prescription_id: prescriptionId || null
    };

    return this.makeRequest('/place-medicine-order', orderData);
  }

  async getUserMedicineOrders(userId: string) {
    return this.makeRequest('/get-user-medicine-orders', { user_id: userId });
  }
}

export const healthService = new HealthService();