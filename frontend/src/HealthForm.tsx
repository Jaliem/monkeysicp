import { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { healthService } from './services/healthService';

interface HealthFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  
  // Medical History
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  previousSurgeries: string;
  familyMedicalHistory: string;
  
  // Current Health Status
  currentSymptoms: string;
  painLevel: number;
  recentChanges: string;
  
  // Lifestyle Information
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietaryRestrictions: string;
  sleepPatterns: string;
  stressLevel: number;
  
  // Wellness Metrics
  height: string;
  weight: string;
  bloodPressure: string;
  heartRate: string;
  
  // Insurance and Healthcare
  insuranceProvider: string;
  policyNumber: string;
  primaryCarePhysician: string;
  preferredPharmacy: string;
}

const HealthForm = () => {
  const [formData, setFormData] = useState<HealthFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    previousSurgeries: '',
    familyMedicalHistory: '',
    currentSymptoms: '',
    painLevel: 0,
    recentChanges: '',
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    dietaryRestrictions: '',
    sleepPatterns: '',
    stressLevel: 0,
    height: '',
    weight: '',
    bloodPressure: '',
    heartRate: '',
    insuranceProvider: '',
    policyNumber: '',
    primaryCarePhysician: '',
    preferredPharmacy: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'painLevel' || name === 'stressLevel' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      const userId = identity.getPrincipal().toString();

      let results = [];

      // Store symptoms if any
      if (formData.currentSymptoms && formData.currentSymptoms.trim()) {
        try {
          const symptomResult = await healthService.storeSymptoms(
            [formData.currentSymptoms], 
            userId
          );
          results.push(`Symptoms: ${symptomResult.message}`);
        } catch (error) {
          console.error('Error storing symptoms:', error);
          results.push('Symptoms: Failed to store');
        }
      }

      // Store wellness log
      const wellnessData = {
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        sleep: formData.sleepPatterns || 'Not specified',
        steps: 0, // Default since not collected in form
        exercise: formData.exerciseFrequency || 'Not specified',
        mood: formData.stressLevel <= 3 ? 'Good' : formData.stressLevel <= 6 ? 'Fair' : 'Poor',
        water_intake: 0 // Default since not collected in form
      };

      try {
        const wellnessResult = await healthService.storeWellnessLog(wellnessData);
        results.push(`Wellness log: ${wellnessResult.message}`);
      } catch (error) {
        console.error('Error storing wellness data:', error);
        results.push('Wellness log: Failed to store');
      }

      // Store medication reminders if any current medications listed
      if (formData.currentMedications && formData.currentMedications.trim()) {
        try {
          const medications = formData.currentMedications.split(',').map(med => med.trim());
          for (const medication of medications.slice(0, 3)) { // Limit to first 3 medications
            if (medication) {
              const reminderResult = await healthService.storeMedicationReminder(
                medication, 
                '08:00', // Default time
                userId
              );
              results.push(`Medication reminder for ${medication}: ${reminderResult.message}`);
            }
          }
        } catch (error) {
          console.error('Error storing medication reminders:', error);
          results.push('Medication reminders: Failed to store');
        }
      }

      // Store comprehensive health profile as a special wellness log entry
      const comprehensiveHealthData = {
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        sleep: `Profile: ${JSON.stringify({
          personalInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            phoneNumber: formData.phoneNumber,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone
          },
          medicalHistory: {
            allergies: formData.allergies,
            chronicConditions: formData.chronicConditions,
            currentMedications: formData.currentMedications,
            previousSurgeries: formData.previousSurgeries,
            familyMedicalHistory: formData.familyMedicalHistory
          },
          lifestyle: {
            smokingStatus: formData.smokingStatus,
            alcoholConsumption: formData.alcoholConsumption,
            exerciseFrequency: formData.exerciseFrequency,
            dietaryRestrictions: formData.dietaryRestrictions,
            stressLevel: formData.stressLevel
          },
          measurements: {
            height: formData.height,
            weight: formData.weight,
            bloodPressure: formData.bloodPressure,
            heartRate: formData.heartRate
          },
          insurance: {
            provider: formData.insuranceProvider,
            policyNumber: formData.policyNumber,
            primaryCarePhysician: formData.primaryCarePhysician,
            preferredPharmacy: formData.preferredPharmacy
          }
        })}`,
        steps: formData.painLevel,
        exercise: formData.exerciseFrequency || 'Not specified',
        mood: formData.stressLevel <= 3 ? 'Good' : formData.stressLevel <= 6 ? 'Fair' : 'Poor',
        water_intake: 0
      };

      try {
        const profileResult = await healthService.storeWellnessLog(comprehensiveHealthData);
        results.push(`Health profile: ${profileResult.message}`);
      } catch (error) {
        console.error('Error storing health profile:', error);
        results.push('Health profile: Failed to store');
      }

      setSubmitMessage(`Health information processing complete! Results:\n${results.join('\n')}`);
      
    } catch (error) {
      console.error('Error submitting health form:', error);
      setSubmitMessage('Error submitting health information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Health Information Form</h1>
        <p className="text-gray-600">Please provide complete information for better healthcare services</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
            <input
              type="tel"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Medical History</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies (medications, foods, environmental)</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="List any known allergies..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
              <textarea
                name="chronicConditions"
                value={formData.chronicConditions}
                onChange={handleInputChange}
                placeholder="Diabetes, hypertension, asthma, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
              <textarea
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                placeholder="List all medications with dosages..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Surgeries or Major Procedures</label>
              <textarea
                name="previousSurgeries"
                value={formData.previousSurgeries}
                onChange={handleInputChange}
                placeholder="Include dates and types of procedures..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Family Medical History</label>
              <textarea
                name="familyMedicalHistory"
                value={formData.familyMedicalHistory}
                onChange={handleInputChange}
                placeholder="Family history of heart disease, cancer, diabetes, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Current Health Status */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Health Status</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms or Concerns</label>
              <textarea
                name="currentSymptoms"
                value={formData.currentSymptoms}
                onChange={handleInputChange}
                placeholder="Describe any current symptoms, pain, or health concerns..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pain Level (0-10)</label>
              <input
                type="range"
                name="painLevel"
                min="0"
                max="10"
                value={formData.painLevel}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm text-gray-600 mt-1">Pain Level: {formData.painLevel}/10</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recent Changes in Health</label>
              <textarea
                name="recentChanges"
                value={formData.recentChanges}
                onChange={handleInputChange}
                placeholder="Any recent changes in weight, appetite, sleep, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Lifestyle Information */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Lifestyle Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Smoking Status</label>
                <select
                  name="smokingStatus"
                  value={formData.smokingStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Never smoked">Never smoked</option>
                  <option value="Former smoker">Former smoker</option>
                  <option value="Current smoker">Current smoker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol Consumption</label>
                <select
                  name="alcoholConsumption"
                  value={formData.alcoholConsumption}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Frequency</option>
                  <option value="Never">Never</option>
                  <option value="Rarely">Rarely</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Frequency</label>
              <select
                name="exerciseFrequency"
                value={formData.exerciseFrequency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Frequency</option>
                <option value="Sedentary">Sedentary (little to no exercise)</option>
                <option value="Light">Light (1-2 times per week)</option>
                <option value="Moderate">Moderate (3-4 times per week)</option>
                <option value="Active">Active (5+ times per week)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions or Special Diet</label>
              <textarea
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleInputChange}
                placeholder="Vegetarian, diabetic, low-sodium, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Patterns</label>
              <textarea
                name="sleepPatterns"
                value={formData.sleepPatterns}
                onChange={handleInputChange}
                placeholder="Average hours per night, sleep quality, issues..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level (0-10)</label>
              <input
                type="range"
                name="stressLevel"
                min="0"
                max="10"
                value={formData.stressLevel}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm text-gray-600 mt-1">Stress Level: {formData.stressLevel}/10</div>
            </div>
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Physical Measurements</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="e.g., 5'8&quot; or 173 cm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 150 lbs or 68 kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (if known)</label>
                <input
                  type="text"
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleInputChange}
                  placeholder="e.g., 120/80"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate (if known)</label>
                <input
                  type="text"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 72 bpm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance and Healthcare */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Insurance and Healthcare Providers</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleInputChange}
                  placeholder="e.g., Blue Cross, Aetna, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Care Physician</label>
                <input
                  type="text"
                  name="primaryCarePhysician"
                  value={formData.primaryCarePhysician}
                  onChange={handleInputChange}
                  placeholder="Dr. Name, Clinic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Pharmacy</label>
                <input
                  type="text"
                  name="preferredPharmacy"
                  value={formData.preferredPharmacy}
                  onChange={handleInputChange}
                  placeholder="CVS, Walgreens, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Health Information'}
          </button>
        </div>

        {submitMessage && (
          <div className={`mt-4 p-4 rounded-lg ${
            submitMessage.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <pre className="whitespace-pre-wrap text-sm">{submitMessage}</pre>
          </div>
        )}
      </form>
    </div>
  );
};

export default HealthForm;