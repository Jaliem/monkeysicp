import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Char "mo:base/Char";
import Float "mo:base/Float";
import Time "mo:base/Time";
import { JSON } "mo:serde";
import Types "./Types";

persistent actor {
  // Record keys for JSON serialization - Healthcare
  transient let WelcomeResponseKeys = ["message"];
  transient let _SymptomDataKeys = ["symptoms", "timestamp", "user_id"];
  transient let _MedicationReminderKeys = ["medicine", "time", "created_at", "user_id", "active"];
  transient let _EmergencyAlertKeys = ["timestamp", "user_id", "status"];
  transient let HealthStorageResponseKeys = ["success", "message", "id"];
  transient let SymptomHistoryResponseKeys = ["symptoms", "total_count"];
  transient let ReminderListResponseKeys = ["reminders", "active_count"];
  transient let EmergencyStatusResponseKeys = ["has_active_emergency", "latest_emergency"];

  // Wellness Record Keys
  transient let _WellnessLogKeys = ["user_id", "date", "sleep", "steps", "exercise", "mood", "water_intake"];
  transient let WellnessStoreResponseKeys = ["success", "message", "id", "logged_data"];
  transient let WellnessSummaryResponseKeys = ["logs", "total_count", "success", "message"];

  // Doctor & Appointment JSON keys
  transient let _DoctorKeys = ["doctor_id", "name", "specialty", "qualifications", "experience_years", "rating", "available_days", "available_slots", "image_url"];
  transient let _AppointmentKeys = ["appointment_id", "doctor_id", "doctor_name", "specialty", "patient_symptoms", "appointment_date", "appointment_time", "status", "urgency", "created_at", "user_id"];
  transient let DoctorSearchResponseKeys = ["doctors", "total_count"];
  transient let AppointmentResponseKeys = ["success", "appointment_id", "message", "appointment"];
  transient let _DoctorAvailabilityResponseKeys = ["doctor", "available_slots", "next_available"];

  // Medicine & Pharmacy JSON keys
  transient let _MedicineKeys = ["medicine_id", "name", "generic_name", "category", "stock", "price", "manufacturer", "description", "requires_prescription", "active_ingredient", "dosage"];
  transient let _MedicineOrderKeys = ["order_id", "medicine_id", "medicine_name", "quantity", "unit_price", "total_price", "user_id", "order_date", "status", "prescription_id", "pharmacy_notes"];
  transient let MedicineSearchResponseKeys = ["medicines", "total_count", "status"];
  transient let MedicineOrderResponseKeys = ["success", "order_id", "message", "order", "suggested_alternatives"];
  transient let PharmacyInventoryResponseKeys = ["medicine", "available", "stock_level", "estimated_restock"];

  // Healthcare data storage
  private var symptom_entries : [(Text, Types.SymptomData)] = [];
  private var medication_reminders : [(Text, Types.MedicationReminder)] = [];
  private var emergency_alerts : [(Text, Types.EmergencyAlert)] = [];
  private var doctor_entries : [(Text, Types.Doctor)] = [];
  private var appointment_entries : [(Text, Types.Appointment)] = [];
  private var wellness_log_entries : [(Text, Types.WellnessLog)] = [];
  private var medicine_entries : [(Text, Types.Medicine)] = [];
  private var medicine_order_entries : [(Text, Types.MedicineOrder)] = [];
  private var next_id : Nat = 1;

  private transient var symptoms = Buffer.Buffer<(Text, Types.SymptomData)>(0);
  private transient var reminders = Buffer.Buffer<(Text, Types.MedicationReminder)>(0);
  private transient var emergencies = Buffer.Buffer<(Text, Types.EmergencyAlert)>(0);
  private transient var doctors = Buffer.Buffer<(Text, Types.Doctor)>(0);
  private transient var appointments = Buffer.Buffer<(Text, Types.Appointment)>(0);
  private transient var wellness_logs = Buffer.Buffer<(Text, Types.WellnessLog)>(0);
  private transient var medicines = Buffer.Buffer<(Text, Types.Medicine)>(0);
  private transient var medicine_orders = Buffer.Buffer<(Text, Types.MedicineOrder)>(0);

  system func preupgrade() {
    symptom_entries := Buffer.toArray(symptoms);
    medication_reminders := Buffer.toArray(reminders);
    emergency_alerts := Buffer.toArray(emergencies);
    doctor_entries := Buffer.toArray(doctors);
    appointment_entries := Buffer.toArray(appointments);
    wellness_log_entries := Buffer.toArray(wellness_logs);
    medicine_entries := Buffer.toArray(medicines);
    medicine_order_entries := Buffer.toArray(medicine_orders);
  };

  system func postupgrade() {
    symptoms := Buffer.fromArray(symptom_entries);
    reminders := Buffer.fromArray(medication_reminders);
    emergencies := Buffer.fromArray(emergency_alerts);
    doctors := Buffer.fromArray(doctor_entries);
    appointments := Buffer.fromArray(appointment_entries);
    wellness_logs := Buffer.fromArray(wellness_log_entries);
    medicines := Buffer.fromArray(medicine_entries);
    medicine_orders := Buffer.fromArray(medicine_order_entries);
    symptom_entries := [];
    medication_reminders := [];
    emergency_alerts := [];
    doctor_entries := [];
    appointment_entries := [];
    wellness_log_entries := [];
    medicine_entries := [];
    medicine_order_entries := [];

    // Initialize doctors if empty
    if (doctors.size() == 0) {
      initializeDoctors();
    };

    // Initialize medicines if empty
    if (medicines.size() == 0) {
      initializeMedicines();
    };
  };

  // ----- Doctor Database Initialization -----

  private func initializeDoctors() {
    Debug.print("[INIT]: Initializing doctor database");

    // CARDIOLOGY DOCTORS
  let card1 : Types.Doctor = {
      doctor_id = "card_001";
      name = "Dr. Amir Hassan";
      specialty = "Cardiology";
      qualifications = "MD, FACC";
      experience_years = 15;
      rating = 4.8;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["09:00", "11:00", "14:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_001", card1));

  let card2 : Types.Doctor = {
      doctor_id = "card_002";
      name = "Dr. Sarah Chen";
      specialty = "Cardiology";
      qualifications = "MD, FACC, FHRS";
      experience_years = 12;
      rating = 4.7;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["10:00", "13:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_002", card2));

  let card3 : Types.Doctor = {
      doctor_id = "card_003";
      name = "Dr. Priya Sharma";
      specialty = "Cardiology";
      qualifications = "MD, FACC, FSCAI";
      experience_years = 18;
      rating = 4.9;
      available_days = ["Monday", "Thursday", "Saturday"];
      available_slots = ["08:00", "12:00", "15:00", "17:00"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_003", card3));

  let card4 : Types.Doctor = {
      doctor_id = "card_004";
      name = "Dr. James Mitchell";
      specialty = "Cardiology";
      qualifications = "MD, FACC, FACS";
      experience_years = 20;
      rating = 4.6;
      available_days = ["Tuesday", "Friday"];
      available_slots = ["09:30", "11:30", "14:30", "16:30"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_004", card4));

  let card5 : Types.Doctor = {
      doctor_id = "card_005";
      name = "Dr. Fatima Al-Zahra";
      specialty = "Cardiology";
      qualifications = "MD, FACC";
      experience_years = 14;
      rating = 4.8;
      available_days = ["Wednesday", "Friday", "Saturday"];
      available_slots = ["08:30", "10:30", "13:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_005", card5));

  let card6 : Types.Doctor = {
      doctor_id = "card_006";
      name = "Dr. Robert Kim";
      specialty = "Cardiology";
      qualifications = "MD, FACC, FHRS";
      experience_years = 16;
      rating = 4.7;
      available_days = ["Monday", "Tuesday"];
      available_slots = ["09:00", "11:00", "14:00"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("card_006", card6));

  // DERMATOLOGY DOCTORS
  let derm1 : Types.Doctor = {
      doctor_id = "derm_001";
      name = "Dr. Bella Rodriguez";
      specialty = "Dermatology";
      qualifications = "MD, FAAD";
      experience_years = 10;
      rating = 4.6;
      available_days = ["Monday", "Tuesday", "Thursday"];
      available_slots = ["08:00", "10:00", "14:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("derm_001", derm1));

  let derm2 : Types.Doctor = {
      doctor_id = "derm_002";
      name = "Dr. Sofia Petrov";
      specialty = "Dermatology";
      qualifications = "MD, FAAD, FACMS";
      experience_years = 17;
      rating = 4.9;
      available_days = ["Wednesday", "Friday"];
      available_slots = ["09:00", "11:00", "13:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("derm_002", derm2));

  let derm3 : Types.Doctor = {
      doctor_id = "derm_003";
      name = "Dr. Ahmed Al-Rashid";
      specialty = "Dermatology";
      qualifications = "MD, FAAD";
      experience_years = 9;
      rating = 4.5;
      available_days = ["Tuesday", "Thursday", "Saturday"];
      available_slots = ["08:30", "10:30", "14:30"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("derm_003", derm3));

  let derm4 : Types.Doctor = {
      doctor_id = "derm_004";
      name = "Dr. Emma Thompson";
      specialty = "Dermatology";
      qualifications = "MD, FAAD, FACMS";
      experience_years = 13;
      rating = 4.8;
      available_days = ["Monday", "Wednesday"];
      available_slots = ["09:30", "11:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("derm_004", derm4));

  let derm5 : Types.Doctor = {
      doctor_id = "derm_005";
      name = "Dr. Marcus Johnson";
      specialty = "Dermatology";
      qualifications = "MD, FAAD";
      experience_years = 15;
      rating = 4.7;
      available_days = ["Tuesday", "Friday"];
      available_slots = ["08:00", "12:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("derm_005", derm5));

  // NEUROLOGY DOCTORS
  let neuro1 : Types.Doctor = {
      doctor_id = "neuro_001";
      name = "Dr. Chen Wang";
      specialty = "Neurology";
      qualifications = "MD, FAAN";
      experience_years = 18;
      rating = 4.9;
      available_days = ["Wednesday", "Friday"];
      available_slots = ["09:00", "13:00", "15:00", "17:00"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("neuro_001", neuro1));

  let neuro2 : Types.Doctor = {
      doctor_id = "neuro_002";
      name = "Dr. Isabella Romano";
      specialty = "Neurology";
      qualifications = "MD, FAAN, FAES";
      experience_years = 22;
      rating = 4.9;
      available_days = ["Monday", "Tuesday"];
      available_slots = ["10:00", "14:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("neuro_002", neuro2));

  let neuro3 : Types.Doctor = {
      doctor_id = "neuro_003";
      name = "Dr. David Kim";
      specialty = "Neurology";
      qualifications = "MD, FAAN";
      experience_years = 11;
      rating = 4.7;
      available_days = ["Thursday", "Friday", "Saturday"];
      available_slots = ["09:00", "11:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("neuro_003", neuro3));

  let neuro4 : Types.Doctor = {
      doctor_id = "neuro_004";
      name = "Dr. Maria Gonzalez";
      specialty = "Neurology";
      qualifications = "MD, FAAN, FAES";
      experience_years = 19;
      rating = 4.8;
      available_days = ["Monday", "Wednesday"];
      available_slots = ["08:30", "12:30", "16:30"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("neuro_004", neuro4));

  let neuro5 : Types.Doctor = {
      doctor_id = "neuro_005";
      name = "Dr. Andrew Foster";
      specialty = "Neurology";
      qualifications = "MD, FAAN";
      experience_years = 14;
      rating = 4.6;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["10:30", "13:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("neuro_005", neuro5));

  // ORTHOPEDICS DOCTORS
  let ortho1 : Types.Doctor = {
      doctor_id = "ortho_001";
      name = "Dr. Miguel Diaz";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS";
      experience_years = 14;
      rating = 4.5;
      available_days = ["Monday", "Wednesday"];
      available_slots = ["09:30", "16:00", "18:00"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("ortho_001", ortho1));

  let ortho2 : Types.Doctor = {
      doctor_id = "ortho_002";
      name = "Dr. Lisa Thompson";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS";
      experience_years = 17;
      rating = 4.8;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["08:00", "10:00", "14:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("ortho_002", ortho2));

  let ortho3 : Types.Doctor = {
      doctor_id = "ortho_003";
      name = "Dr. Carlos Mendez";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS, FACS";
      experience_years = 19;
      rating = 4.6;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["09:00", "13:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("ortho_003", ortho3));

  let ortho4 : Types.Doctor = {
      doctor_id = "ortho_004";
      name = "Dr. Jennifer Park";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS";
      experience_years = 12;
      rating = 4.7;
      available_days = ["Tuesday", "Friday"];
      available_slots = ["08:30", "11:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("ortho_004", ortho4));

  let ortho5 : Types.Doctor = {
      doctor_id = "ortho_005";
      name = "Dr. Viktor Petrov";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS, FACS";
      experience_years = 21;
      rating = 4.9;
      available_days = ["Wednesday", "Thursday", "Saturday"];
      available_slots = ["09:00", "12:00", "14:00"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("ortho_005", ortho5));

  // PEDIATRICS DOCTORS
  let pedia1 : Types.Doctor = {
      doctor_id = "pedia_001";
      name = "Dr. Emily Johnson";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP";
      experience_years = 8;
      rating = 4.8;
      available_days = ["Tuesday", "Thursday", "Saturday"];
      available_slots = ["08:00", "12:00", "14:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_001", pedia1));

  let pedia2 : Types.Doctor = {
      doctor_id = "pedia_002";
      name = "Dr. Rachel Green";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP";
      experience_years = 12;
      rating = 4.7;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["08:30", "10:30", "13:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_002", pedia2));

  let pedia3 : Types.Doctor = {
      doctor_id = "pedia_003";
      name = "Dr. Yuki Yamamoto";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP, FPIDS";
      experience_years = 15;
      rating = 4.9;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["09:00", "12:00", "14:00"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_003", pedia3));

  let pedia4 : Types.Doctor = {
      doctor_id = "pedia_004";
      name = "Dr. Hannah Miller";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP";
      experience_years = 10;
      rating = 4.6;
      available_days = ["Monday", "Friday"];
      available_slots = ["08:00", "11:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_004", pedia4));

  let pedia5 : Types.Doctor = {
      doctor_id = "pedia_005";
      name = "Dr. Omar Hassan";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP, FPEM";
      experience_years = 18;
      rating = 4.8;
      available_days = ["Wednesday", "Saturday"];
      available_slots = ["09:30", "11:30", "13:30"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_005", pedia5));

  let pedia6 : Types.Doctor = {
      doctor_id = "pedia_006";
      name = "Dr. Sophie Laurent";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP";
      experience_years = 7;
      rating = 4.5;
      available_days = ["Tuesday", "Thursday", "Friday"];
      available_slots = ["08:30", "12:30", "16:30"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("pedia_006", pedia6));

  // PSYCHIATRY DOCTORS
  let psych1 : Types.Doctor = {
      doctor_id = "psych_001";
      name = "Dr. Grace Liu";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA";
      experience_years = 11;
      rating = 4.6;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["09:15", "11:15", "13:15"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("psych_001", psych1));

  let psych2 : Types.Doctor = {
      doctor_id = "psych_002";
      name = "Dr. Michael Foster";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA";
      experience_years = 16;
      rating = 4.8;
      available_days = ["Monday", "Wednesday"];
      available_slots = ["10:00", "12:00", "14:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("psych_002", psych2));

  let psych3 : Types.Doctor = {
      doctor_id = "psych_003";
      name = "Dr. Nina Volkov";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA, FACEP";
      experience_years = 13;
      rating = 4.5;
      available_days = ["Tuesday", "Friday"];
      available_slots = ["09:30", "11:30", "13:30"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("psych_003", psych3));

  let psych4 : Types.Doctor = {
      doctor_id = "psych_004";
      name = "Dr. Samuel Wright";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA";
      experience_years = 19;
      rating = 4.9;
      available_days = ["Monday", "Thursday"];
      available_slots = ["08:00", "10:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("psych_004", psych4));

  let psych5 : Types.Doctor = {
      doctor_id = "psych_005";
      name = "Dr. Amara Patel";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA, FAACAP";
      experience_years = 14;
      rating = 4.7;
      available_days = ["Wednesday", "Friday", "Saturday"];
      available_slots = ["09:00", "13:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("psych_005", psych5));

  // ONCOLOGY DOCTORS
  let onco1 : Types.Doctor = {
      doctor_id = "onco_001";
      name = "Dr. Faisal Ahmad";
      specialty = "Oncology";
      qualifications = "MD, FACP";
      experience_years = 20;
      rating = 4.7;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["10:30", "13:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("onco_001", onco1));

  let onco2 : Types.Doctor = {
      doctor_id = "onco_002";
      name = "Dr. Catherine Brooks";
      specialty = "Oncology";
      qualifications = "MD, FACP, FASCO";
      experience_years = 17;
      rating = 4.8;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["09:00", "12:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("onco_002", onco2));

  let onco3 : Types.Doctor = {
      doctor_id = "onco_003";
      name = "Dr. Rajesh Kumar";
      specialty = "Oncology";
      qualifications = "MD, FACP";
      experience_years = 22;
      rating = 4.9;
      available_days = ["Monday", "Thursday"];
      available_slots = ["08:30", "11:30", "14:30"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("onco_003", onco3));

  let onco4 : Types.Doctor = {
      doctor_id = "onco_004";
      name = "Dr. Elena Rossi";
      specialty = "Oncology";
      qualifications = "MD, FACP, FASCO";
      experience_years = 15;
      rating = 4.6;
      available_days = ["Wednesday", "Friday"];
      available_slots = ["10:00", "13:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("onco_004", onco4));

  let onco5 : Types.Doctor = {
      doctor_id = "onco_005";
      name = "Dr. Jonathan Davis";
      specialty = "Oncology";
      qualifications = "MD, FACP";
      experience_years = 18;
      rating = 4.8;
      available_days = ["Tuesday", "Saturday"];
      available_slots = ["09:30", "12:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("onco_005", onco5));

  // GENERAL PRACTITIONER DOCTORS
  let gp1 : Types.Doctor = {
      doctor_id = "gp_001";
      name = "Dr. Hiro Tanaka";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 7;
      rating = 4.4;
      available_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      available_slots = ["08:30", "10:30", "12:30", "14:30"];
      image_url = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_001", gp1));

  let gp2 : Types.Doctor = {
      doctor_id = "gp_002";
      name = "Dr. Sarah Williams";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 10;
      rating = 4.6;
      available_days = ["Monday", "Tuesday", "Thursday"];
      available_slots = ["08:00", "11:00", "13:00", "16:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_002", gp2));

  let gp3 : Types.Doctor = {
      doctor_id = "gp_003";
      name = "Dr. Robert Clarke";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP, ABFM";
      experience_years = 14;
      rating = 4.7;
      available_days = ["Wednesday", "Friday"];
      available_slots = ["09:00", "11:30", "14:30"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_003", gp3));

  let gp4 : Types.Doctor = {
      doctor_id = "gp_004";
      name = "Dr. Angela Martinez";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 12;
      rating = 4.5;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["08:00", "10:00", "15:00", "17:00"];
      image_url = "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_004", gp4));

  let gp5 : Types.Doctor = {
      doctor_id = "gp_005";
      name = "Dr. Thomas Anderson";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP, ABFM";
      experience_years = 16;
      rating = 4.8;
      available_days = ["Tuesday", "Thursday", "Saturday"];
      available_slots = ["09:30", "12:00", "14:00"];
      image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_005", gp5));

  let gp6 : Types.Doctor = {
      doctor_id = "gp_006";
      name = "Dr. Priyanka Singh";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 9;
      rating = 4.6;
      available_days = ["Monday", "Tuesday", "Friday"];
      available_slots = ["08:30", "11:30", "13:30", "16:30"];
      image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_006", gp6));

  let gp7 : Types.Doctor = {
      doctor_id = "gp_007";
      name = "Dr. Kevin O'Brien";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 11;
      rating = 4.4;
      available_days = ["Wednesday", "Thursday", "Saturday"];
      available_slots = ["09:00", "12:30", "15:30"];
      image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
  };
  doctors.add(("gp_007", gp7));

  let gp8 : Types.Doctor = {
      doctor_id = "gp_008";
      name = "Dr. Fatima Nasser";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP, ABFM";
      experience_years = 13;
      rating = 4.7;
      available_days = ["Monday", "Thursday"];
      available_slots = ["08:00", "10:30", "13:00", "15:00"];
      image_url = "https://images.unsplash.com/photo-1594824848637-114aa33c54d7?w=400&h=400&fit=crop&crop=face";
  };
doctors.add(("gp_008", gp8));

    Debug.print("[INIT]: Added " # Nat.toText(doctors.size()) # " doctors to database");
  };

  // ----- Medicine Database Initialization -----

  private func initializeMedicines() {
    Debug.print("[INIT]: Initializing medicine database");

    // Pain Relief medicines
    let paracetamol : Types.Medicine = {
      medicine_id = "med_001";
      name = "Paracetamol";
      generic_name = ?"Acetaminophen";
      category = "Pain relief";
      stock = 150;
      price = 5.99;
      manufacturer = ?"PharmaCorp";
      description = ?"Effective pain reliever and fever reducer";
      requires_prescription = false;
      active_ingredient = ?"Acetaminophen 500mg";
      dosage = ?"1-2 tablets every 4-6 hours";
    };
    medicines.add(("med_001", paracetamol));

    let ibuprofen : Types.Medicine = {
      medicine_id = "med_002";
      name = "Ibuprofen";
      generic_name = ?"Ibuprofen";
      category = "Pain relief";
      stock = 120;
      price = 7.50;
      manufacturer = ?"HealthPlus";
      description = ?"Anti-inflammatory pain reliever";
      requires_prescription = false;
      active_ingredient = ?"Ibuprofen 400mg";
      dosage = ?"1 tablet every 6-8 hours";
    };
    medicines.add(("med_002", ibuprofen));

    let aspirin : Types.Medicine = {
      medicine_id = "med_003";
      name = "Aspirin";
      generic_name = ?"Acetylsalicylic acid";
      category = "Pain relief";
      stock = 80;
      price = 4.25;
      manufacturer = ?"MediCare";
      description = ?"Pain relief and blood thinner";
      requires_prescription = false;
      active_ingredient = ?"Acetylsalicylic acid 325mg";
      dosage = ?"1-2 tablets every 4 hours";
    };
    medicines.add(("med_003", aspirin));

    let naproxen : Types.Medicine = {
      medicine_id = "med_004";
      name = "Naproxen";
      generic_name = ?"Naproxen Sodium";
      category = "Pain relief";
      stock = 95;
      price = 8.75;
      manufacturer = ?"HealthPlus";
      description = ?"Long-lasting pain and inflammation relief";
      requires_prescription = false;
      active_ingredient = ?"Naproxen Sodium 220mg";
      dosage = ?"1 tablet every 8-12 hours";
    };
    medicines.add(("med_004", naproxen));

    // Antibiotics
    let amoxicillin : Types.Medicine = {
      medicine_id = "med_005";
      name = "Amoxicillin";
      generic_name = ?"Amoxicillin";
      category = "Antibiotic";
      stock = 60;
      price = 15.99;
      manufacturer = ?"PharmaLab";
      description = ?"Broad-spectrum antibiotic";
      requires_prescription = true;
      active_ingredient = ?"Amoxicillin 500mg";
      dosage = ?"1 capsule every 8 hours";
    };
    medicines.add(("med_005", amoxicillin));

    let azithromycin : Types.Medicine = {
      medicine_id = "med_006";
      name = "Azithromycin";
      generic_name = ?"Azithromycin";
      category = "Antibiotic";
      stock = 40;
      price = 25.99;
      manufacturer = ?"PharmaLab";
      description = ?"Macrolide antibiotic";
      requires_prescription = true;
      active_ingredient = ?"Azithromycin 250mg";
      dosage = ?"1 tablet daily for 5 days";
    };
    medicines.add(("med_006", azithromycin));

    let ciprofloxacin : Types.Medicine = {
      medicine_id = "med_007";
      name = "Ciprofloxacin";
      generic_name = ?"Ciprofloxacin HCl";
      category = "Antibiotic";
      stock = 35;
      price = 31.75;
      manufacturer = ?"PharmaLab";
      description = ?"Fluoroquinolone antibiotic";
      requires_prescription = true;
      active_ingredient = ?"Ciprofloxacin HCl 500mg";
      dosage = ?"1 tablet every 12 hours";
    };
    medicines.add(("med_007", ciprofloxacin));

    let doxycycline : Types.Medicine = {
      medicine_id = "med_008";
      name = "Doxycycline";
      generic_name = ?"Doxycycline Hyclate";
      category = "Antibiotic";
      stock = 45;
      price = 22.50;
      manufacturer = ?"PharmaLab";
      description = ?"Tetracycline antibiotic";
      requires_prescription = true;
      active_ingredient = ?"Doxycycline Hyclate 100mg";
      dosage = ?"1 tablet every 12 hours";
    };
    medicines.add(("med_008", doxycycline));

    // Vitamins
    let vitamin_c : Types.Medicine = {
      medicine_id = "med_009";
      name = "Vitamin C";
      generic_name = ?"Ascorbic Acid";
      category = "Vitamin";
      stock = 200;
      price = 8.99;
      manufacturer = ?"VitaHealth";
      description = ?"Immune system support";
      requires_prescription = false;
      active_ingredient = ?"Ascorbic Acid 1000mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_009", vitamin_c));

    let vitamin_d : Types.Medicine = {
      medicine_id = "med_010";
      name = "Vitamin D3";
      generic_name = ?"Cholecalciferol";
      category = "Vitamin";
      stock = 180;
      price = 12.50;
      manufacturer = ?"VitaHealth";
      description = ?"Bone health and immune support";
      requires_prescription = false;
      active_ingredient = ?"Cholecalciferol 2000 IU";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_010", vitamin_d));

    let vitamin_b12 : Types.Medicine = {
      medicine_id = "med_011";
      name = "Vitamin B12";
      generic_name = ?"Cyanocobalamin";
      category = "Vitamin";
      stock = 160;
      price = 14.99;
      manufacturer = ?"VitaHealth";
      description = ?"Energy and nerve function support";
      requires_prescription = false;
      active_ingredient = ?"Cyanocobalamin 1000mcg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_011", vitamin_b12));

    let calcium : Types.Medicine = {
      medicine_id = "med_012";
      name = "Calcium Carbonate";
      generic_name = ?"Calcium Carbonate";
      category = "Vitamin";
      stock = 140;
      price = 11.50;
      manufacturer = ?"VitaHealth";
      description = ?"Bone health supplement";
      requires_prescription = false;
      active_ingredient = ?"Calcium Carbonate 600mg";
      dosage = ?"1-2 tablets daily with food";
    };
    medicines.add(("med_012", calcium));

    let multivitamin : Types.Medicine = {
      medicine_id = "med_013";
      name = "Multivitamin";
      generic_name = ?"Multi-Vitamin Complex";
      category = "Vitamin";
      stock = 120;
      price = 16.75;
      manufacturer = ?"VitaHealth";
      description = ?"Complete daily vitamin supplement";
      requires_prescription = false;
      active_ingredient = ?"Multiple vitamins and minerals";
      dosage = ?"1 tablet daily with food";
    };
    medicines.add(("med_013", multivitamin));

    // Allergy medicines
    let cetirizine : Types.Medicine = {
      medicine_id = "med_014";
      name = "Cetirizine";
      generic_name = ?"Cetirizine Hydrochloride";
      category = "Allergy";
      stock = 90;
      price = 6.75;
      manufacturer = ?"AllerCare";
      description = ?"Non-drowsy antihistamine";
      requires_prescription = false;
      active_ingredient = ?"Cetirizine HCl 10mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_014", cetirizine));

    let loratadine : Types.Medicine = {
      medicine_id = "med_015";
      name = "Loratadine";
      generic_name = ?"Loratadine";
      category = "Allergy";
      stock = 85;
      price = 7.25;
      manufacturer = ?"AllerCare";
      description = ?"24-hour allergy relief";
      requires_prescription = false;
      active_ingredient = ?"Loratadine 10mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_015", loratadine));

    let diphenhydramine : Types.Medicine = {
      medicine_id = "med_016";
      name = "Diphenhydramine";
      generic_name = ?"Diphenhydramine HCl";
      category = "Allergy";
      stock = 75;
      price = 5.99;
      manufacturer = ?"AllerCare";
      description = ?"Antihistamine for allergies and sleep";
      requires_prescription = false;
      active_ingredient = ?"Diphenhydramine HCl 25mg";
      dosage = ?"1-2 tablets every 4-6 hours";
    };
    medicines.add(("med_016", diphenhydramine));

    let fexofenadine : Types.Medicine = {
      medicine_id = "med_017";
      name = "Fexofenadine";
      generic_name = ?"Fexofenadine HCl";
      category = "Allergy";
      stock = 70;
      price = 9.50;
      manufacturer = ?"AllerCare";
      description = ?"Non-drowsy 24-hour allergy relief";
      requires_prescription = false;
      active_ingredient = ?"Fexofenadine HCl 180mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_017", fexofenadine));

    // Diabetes medication
    let insulin : Types.Medicine = {
      medicine_id = "med_018";
      name = "Insulin Glargine";
      generic_name = ?"Insulin Glargine";
      category = "Diabetes";
      stock = 25;
      price = 89.99;
      manufacturer = ?"DiabetesCare";
      description = ?"Long-acting insulin";
      requires_prescription = true;
      active_ingredient = ?"Insulin Glargine 100 units/mL";
      dosage = ?"As prescribed by physician";
    };
    medicines.add(("med_018", insulin));

    let regular_insulin : Types.Medicine = {
      medicine_id = "med_019";
      name = "Insulin";
      generic_name = ?"Human Insulin";
      category = "Diabetes";
      stock = 40;
      price = 75.50;
      manufacturer = ?"DiabetesCare";
      description = ?"Regular human insulin";
      requires_prescription = true;
      active_ingredient = ?"Human Insulin 100 units/mL";
      dosage = ?"As prescribed by physician";
    };
    medicines.add(("med_019", regular_insulin));

    let metformin : Types.Medicine = {
      medicine_id = "med_020";
      name = "Metformin";
      generic_name = ?"Metformin HCl";
      category = "Diabetes";
      stock = 80;
      price = 18.75;
      manufacturer = ?"DiabetesCare";
      description = ?"Type 2 diabetes medication";
      requires_prescription = true;
      active_ingredient = ?"Metformin HCl 500mg";
      dosage = ?"1-2 tablets twice daily with meals";
    };
    medicines.add(("med_020", metformin));

    let glipizide : Types.Medicine = {
      medicine_id = "med_021";
      name = "Glipizide";
      generic_name = ?"Glipizide";
      category = "Diabetes";
      stock = 55;
      price = 24.99;
      manufacturer = ?"DiabetesCare";
      description = ?"Sulfonylurea diabetes medication";
      requires_prescription = true;
      active_ingredient = ?"Glipizide 5mg";
      dosage = ?"1 tablet daily before breakfast";
    };
    medicines.add(("med_021", glipizide));

    // Heart medicines
    let lisinopril : Types.Medicine = {
      medicine_id = "med_022";
      name = "Lisinopril";
      generic_name = ?"Lisinopril";
      category = "Heart";
      stock = 75;
      price = 22.99;
      manufacturer = ?"CardioMed";
      description = ?"ACE inhibitor for high blood pressure";
      requires_prescription = true;
      active_ingredient = ?"Lisinopril 10mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_022", lisinopril));

    let amlodipine : Types.Medicine = {
      medicine_id = "med_023";
      name = "Amlodipine";
      generic_name = ?"Amlodipine Besylate";
      category = "Heart";
      stock = 85;
      price = 19.75;
      manufacturer = ?"CardioMed";
      description = ?"Calcium channel blocker";
      requires_prescription = true;
      active_ingredient = ?"Amlodipine Besylate 5mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_023", amlodipine));

    let atorvastatin : Types.Medicine = {
      medicine_id = "med_024";
      name = "Atorvastatin";
      generic_name = ?"Atorvastatin Calcium";
      category = "Heart";
      stock = 65;
      price = 34.50;
      manufacturer = ?"CardioMed";
      description = ?"Statin for cholesterol management";
      requires_prescription = true;
      active_ingredient = ?"Atorvastatin Calcium 20mg";
      dosage = ?"1 tablet daily in the evening";
    };
    medicines.add(("med_024", atorvastatin));

    let metoprolol : Types.Medicine = {
      medicine_id = "med_025";
      name = "Metoprolol";
      generic_name = ?"Metoprolol Tartrate";
      category = "Heart";
      stock = 70;
      price = 21.25;
      manufacturer = ?"CardioMed";
      description = ?"Beta-blocker for heart conditions";
      requires_prescription = true;
      active_ingredient = ?"Metoprolol Tartrate 50mg";
      dosage = ?"1 tablet twice daily";
    };
    medicines.add(("med_025", metoprolol));

    // Mental Health medicines
    let sertraline : Types.Medicine = {
      medicine_id = "med_026";
      name = "Sertraline";
      generic_name = ?"Sertraline HCl";
      category = "Mental Health";
      stock = 50;
      price = 45.99;
      manufacturer = ?"MindCare";
      description = ?"SSRI antidepressant";
      requires_prescription = true;
      active_ingredient = ?"Sertraline HCl 50mg";
      dosage = ?"1 tablet daily";
    };
    medicines.add(("med_026", sertraline));

    let lorazepam : Types.Medicine = {
      medicine_id = "med_027";
      name = "Lorazepam";
      generic_name = ?"Lorazepam";
      category = "Mental Health";
      stock = 30;
      price = 38.50;
      manufacturer = ?"MindCare";
      description = ?"Benzodiazepine for anxiety";
      requires_prescription = true;
      active_ingredient = ?"Lorazepam 1mg";
      dosage = ?"As prescribed by physician";
    };
    medicines.add(("med_027", lorazepam));

    let fluoxetine : Types.Medicine = {
      medicine_id = "med_028";
      name = "Fluoxetine";
      generic_name = ?"Fluoxetine HCl";
      category = "Mental Health";
      stock = 45;
      price = 42.75;
      manufacturer = ?"MindCare";
      description = ?"SSRI antidepressant";
      requires_prescription = true;
      active_ingredient = ?"Fluoxetine HCl 20mg";
      dosage = ?"1 tablet daily in morning";
    };
    medicines.add(("med_028", fluoxetine));

    // Digestive Health medicines
    let omeprazole : Types.Medicine = {
      medicine_id = "med_029";
      name = "Omeprazole";
      generic_name = ?"Omeprazole";
      category = "Digestive health";
      stock = 45;
      price = 18.99;
      manufacturer = ?"DigestCare";
      description = ?"Acid reducer for heartburn";
      requires_prescription = false;
      active_ingredient = ?"Omeprazole 20mg";
      dosage = ?"1 capsule daily before breakfast";
    };
    medicines.add(("med_029", omeprazole));

    let loperamide : Types.Medicine = {
      medicine_id = "med_030";
      name = "Loperamide";
      generic_name = ?"Loperamide HCl";
      category = "Digestive health";
      stock = 65;
      price = 9.75;
      manufacturer = ?"DigestCare";
      description = ?"Anti-diarrheal medication";
      requires_prescription = false;
      active_ingredient = ?"Loperamide HCl 2mg";
      dosage = ?"2 tablets initially, then 1 after each loose stool";
    };
    medicines.add(("med_030", loperamide));

    Debug.print("[INIT]: Added " # Nat.toText(medicines.size()) # " medicines to database");
  };

  // Initialize doctors on actor startup (for fresh deployments)
  if (doctors.size() == 0) {
    initializeDoctors();
  };

  // Initialize medicines on actor startup (for fresh deployments)
  if (medicines.size() == 0) {
    initializeMedicines();
  };

  // ----- Public API functions -----

  // Welcome message
  public shared query func welcome() : async Types.WelcomeResponse {
    {
      message = "Welcome to the HealthCare Agent API";
    };
  };

  // ----- Healthcare API functions -----

  // Store symptom data
  public shared func store_symptoms(symptom_data : Types.SymptomData) : async Types.HealthStorageResponse {
    let id = "symptom_" # Int.toText(next_id);
    symptoms.add((id, symptom_data));
    next_id += 1;
    Debug.print("[HEALTH]: Stored symptom data for user " # symptom_data.user_id);
    {
      success = true;
      message = "Symptoms stored successfully";
      id = ?id;
    };
  };

  // Store medication reminder
  public shared func store_reminder(reminder_data : Types.MedicationReminder) : async Types.HealthStorageResponse {
    let id = "reminder_" # Int.toText(next_id);
    reminders.add((id, reminder_data));
    next_id += 1;
    Debug.print("[HEALTH]: Stored medication reminder for user " # reminder_data.user_id);
    {
      success = true;
      message = "Medication reminder stored successfully";
      id = ?id;
    };
  };

  // Store emergency alert
  public shared func emergency_alert(emergency_data : Types.EmergencyAlert) : async Types.HealthStorageResponse {
    let id = "emergency_" # Int.toText(next_id);
    emergencies.add((id, emergency_data));
    next_id += 1;
    Debug.print("[EMERGENCY]: Emergency alert stored for user " # emergency_data.user_id);
    {
      success = true;
      message = "Emergency alert recorded";
      id = ?id;
    };
  };

  // Get symptom history for a user
  public shared query func get_symptom_history(user_id : Text) : async Types.SymptomHistoryResponse {
    let user_symptoms = Buffer.Buffer<Types.SymptomData>(0);
    for ((_, symptom) in symptoms.vals()) {
      if (symptom.user_id == user_id) {
        user_symptoms.add(symptom);
      };
    };
    {
      symptoms = Buffer.toArray(user_symptoms);
      total_count = user_symptoms.size();
    };
  };

  // Get medication reminders for a user
  public shared query func get_reminders(user_id : Text) : async Types.ReminderListResponse {
    let user_reminders = Buffer.Buffer<Types.MedicationReminder>(0);
    var active_count = 0;
    for ((_, reminder) in reminders.vals()) {
      if (reminder.user_id == user_id) {
        user_reminders.add(reminder);
        if (reminder.active) {
          active_count += 1;
        };
      };
    };
    {
      reminders = Buffer.toArray(user_reminders);
      active_count = active_count;
    };
  };

  // Get emergency status for a user
  public shared query func get_emergency_status(user_id : Text) : async Types.EmergencyStatusResponse {
    var latest_emergency : ?Types.EmergencyAlert = null;
    var has_active = false;

    for ((_, emergency) in emergencies.vals()) {
      if (emergency.user_id == user_id and emergency.status == "active") {
        latest_emergency := ?emergency;
        has_active := true;
      };
    };

    {
      has_active_emergency = has_active;
      latest_emergency = latest_emergency;
    };
  };

  // ----- Doctor & Appointment API functions -----

  // Store doctor information
  public shared func store_doctor(doctor_data : Types.Doctor) : async Types.HealthStorageResponse {
    let id = "doctor_" # Int.toText(next_id);
    doctors.add((id, doctor_data));
    next_id += 1;
    Debug.print("[DOCTOR]: Stored doctor " # doctor_data.name # " (" # doctor_data.specialty # ")");
    {
      success = true;
      message = "Doctor stored successfully";
      id = ?id;
    };
  };

  // Get doctors by specialty
  public shared query func get_doctors_by_specialty(specialty : Text) : async Types.DoctorSearchResponse {
    let matching_doctors = Buffer.Buffer<Types.Doctor>(0);
    let specialty_lower = Text.map(specialty, func(c : Char) : Char {
      if (c >= 'A' and c <= 'Z') {
        Char.fromNat32(Char.toNat32(c) + 32)
      } else { c }
    });

    for ((_, doctor) in doctors.vals()) {
      let doctor_specialty_lower = Text.map(doctor.specialty, func(c : Char) : Char {
        if (c >= 'A' and c <= 'Z') {
          Char.fromNat32(Char.toNat32(c) + 32)
        } else { c }
      });

      if (Text.contains(doctor_specialty_lower, #text specialty_lower) or
          Text.contains(specialty_lower, #text doctor_specialty_lower) or
          specialty_lower == "general") {
        matching_doctors.add(doctor);
      };
    };

    {
      doctors = Buffer.toArray(matching_doctors);
      total_count = matching_doctors.size();
    };
  };

  // Store appointment
  public shared func store_appointment(appointment_data : Types.Appointment) : async Types.AppointmentResponse {
    let id = "appointment_" # Int.toText(next_id);
    appointments.add((id, appointment_data));
    next_id += 1;
    Debug.print("[APPOINTMENT]: Stored appointment " # appointment_data.appointment_id # " for " # appointment_data.user_id);
    {
      success = true;
      appointment_id = ?appointment_data.appointment_id;
      message = "Appointment booked successfully";
      appointment = ?appointment_data;
    };
  };

  // Get appointments for a user
  public shared query func get_user_appointments(user_id : Text) : async [Types.Appointment] {
    let user_appointments = Buffer.Buffer<Types.Appointment>(0);
    for ((_, appointment) in appointments.vals()) {
      if (appointment.user_id == user_id) {
        user_appointments.add(appointment);
      };
    };
    Buffer.toArray(user_appointments);
  };

  // Update appointment status
  public shared func update_appointment(appointment_id : Text, new_status : Text) : async Types.AppointmentResponse {
    for (i in appointments.vals()) {
      let (id, appointment) = i;
      if (appointment.appointment_id == appointment_id) {
        let updated_appointment : Types.Appointment = {
          appointment_id = appointment.appointment_id;
          doctor_id = appointment.doctor_id;
          doctor_name = appointment.doctor_name;
          specialty = appointment.specialty;
          patient_symptoms = appointment.patient_symptoms;
          appointment_date = appointment.appointment_date;
          appointment_time = appointment.appointment_time;
          status = new_status;
          urgency = appointment.urgency;
          created_at = appointment.created_at;
          user_id = appointment.user_id;
        };

        // Replace in buffer (simplified approach)
        appointments.add((id, updated_appointment));

        return {
          success = true;
          appointment_id = ?appointment_id;
          message = "Appointment updated successfully";
          appointment = ?updated_appointment;
        };
      };
    };

    {
      success = false;
      appointment_id = null;
      message = "Appointment not found";
      appointment = null;
    };
  };

  // ----- Medicine & Pharmacy API functions -----

  // Store medicine information
  public shared func store_medicine(medicine_data : Types.Medicine) : async Types.HealthStorageResponse {
    let id = "medicine_" # Int.toText(next_id);
    medicines.add((id, medicine_data));
    next_id += 1;
    Debug.print("[MEDICINE]: Stored medicine " # medicine_data.name # " (" # medicine_data.category # ")");
    {
      success = true;
      message = "Medicine stored successfully";
      id = ?id;
    };
  };

  // Search medicines by name (partial match)
  public shared query func search_medicines_by_name(medicine_name : Text) : async Types.MedicineSearchResponse {
    let matching_medicines = Buffer.Buffer<Types.Medicine>(0);
    let name_lower = Text.map(medicine_name, func(c : Char) : Char {
      if (c >= 'A' and c <= 'Z') {
        Char.fromNat32(Char.toNat32(c) + 32)
      } else { c }
    });

    for ((_, medicine) in medicines.vals()) {
      let medicine_name_lower = Text.map(medicine.name, func(c : Char) : Char {
        if (c >= 'A' and c <= 'Z') {
          Char.fromNat32(Char.toNat32(c) + 32)
        } else { c }
      });

      let generic_name_lower = switch (medicine.generic_name) {
        case null { "" };
        case (?generic) {
          Text.map(generic, func(c : Char) : Char {
            if (c >= 'A' and c <= 'Z') {
              Char.fromNat32(Char.toNat32(c) + 32)
            } else { c }
          });
        };
      };

      if (Text.contains(medicine_name_lower, #text name_lower) or
          Text.contains(name_lower, #text medicine_name_lower) or
          Text.contains(generic_name_lower, #text name_lower)) {
        matching_medicines.add(medicine);
      };
    };

    {
      medicines = Buffer.toArray(matching_medicines);
      total_count = matching_medicines.size();
      status = "success";
    };
  };

  // Search medicines by category
  public shared query func search_medicines_by_category(category : Text) : async Types.MedicineSearchResponse {
    let matching_medicines = Buffer.Buffer<Types.Medicine>(0);
    let category_lower = Text.map(category, func(c : Char) : Char {
      if (c >= 'A' and c <= 'Z') {
        Char.fromNat32(Char.toNat32(c) + 32)
      } else { c }
    });

    for ((_, medicine) in medicines.vals()) {
      let medicine_category_lower = Text.map(medicine.category, func(c : Char) : Char {
        if (c >= 'A' and c <= 'Z') {
          Char.fromNat32(Char.toNat32(c) + 32)
        } else { c }
      });

      if (Text.contains(medicine_category_lower, #text category_lower) or
          Text.contains(category_lower, #text medicine_category_lower)) {
        matching_medicines.add(medicine);
      };
    };

    {
      medicines = Buffer.toArray(matching_medicines);
      total_count = matching_medicines.size();
      status = "success";
    };
  };

  // Get medicine by ID with inventory status
  public shared query func get_medicine_by_id(medicine_id : Text) : async ?Types.PharmacyInventoryResponse {
    for ((_, medicine) in medicines.vals()) {
      if (medicine.medicine_id == medicine_id) {
        return ?{
          medicine = medicine;
          available = medicine.stock > 0;
          stock_level = medicine.stock;
          estimated_restock = if (medicine.stock == 0) { ?"2-3 business days" } else { null };
        };
      };
    };
    null;
  };

  // Place medicine order
  public shared func place_medicine_order(medicine_id : Text, quantity : Nat, user_id : Text, prescription_id : ?Text) : async Types.MedicineOrderResponse {
    // Find the medicine
    var found_medicine : ?Types.Medicine = null;
    var medicine_index : ?Nat = null;

    var index = 0;
    for ((_, medicine) in medicines.vals()) {
      if (medicine.medicine_id == medicine_id) {
        found_medicine := ?medicine;
        medicine_index := ?index;
      };
      index += 1;
    };

    switch (found_medicine) {
      case null {
        return {
          success = false;
          order_id = null;
          message = "Medicine not found";
          order = null;
          suggested_alternatives = null;
        };
      };
      case (?medicine) {
        // Check prescription requirement
        if (medicine.requires_prescription and prescription_id == null) {
          return {
            success = false;
            order_id = null;
            message = "This medicine requires a prescription";
            order = null;
            suggested_alternatives = null;
          };
        };

        // Check stock availability
        if (medicine.stock < quantity) {
          // Get alternative suggestions from same category
          let alternatives = Buffer.Buffer<Types.Medicine>(0);
          for ((_, alt_medicine) in medicines.vals()) {
            if (alt_medicine.medicine_id != medicine_id and
                alt_medicine.category == medicine.category and
                alt_medicine.stock >= quantity and
                alternatives.size() < 3) {
              alternatives.add(alt_medicine);
            };
          };

          return {
            success = false;
            order_id = null;
            message = "Insufficient stock. Available: " # Nat.toText(medicine.stock) # " units";
            order = null;
            suggested_alternatives = if (alternatives.size() > 0) { ?Buffer.toArray(alternatives) } else { null };
          };
        };

        // Create order
        let order_id = "ORD-" # Int.toText(Time.now()) # "-" # Nat.toText(next_id);
        let total_price = medicine.price * Float.fromInt(quantity);

        let order : Types.MedicineOrder = {
          order_id = order_id;
          medicine_id = medicine_id;
          medicine_name = medicine.name;
          quantity = quantity;
          unit_price = medicine.price;
          total_price = total_price;
          user_id = user_id;
          order_date = Int.toText(Time.now());
          status = "confirmed";
          prescription_id = prescription_id;
          pharmacy_notes = ?"Order confirmed and ready for pickup";
        };

        // Store order
        let order_storage_id = "order_" # Int.toText(next_id);
        medicine_orders.add((order_storage_id, order));
        next_id += 1;

        // Update medicine stock - create updated medicine record
        let updated_medicine : Types.Medicine = {
          medicine_id = medicine.medicine_id;
          name = medicine.name;
          generic_name = medicine.generic_name;
          category = medicine.category;
          stock = medicine.stock - quantity;
          price = medicine.price;
          manufacturer = medicine.manufacturer;
          description = medicine.description;
          requires_prescription = medicine.requires_prescription;
          active_ingredient = medicine.active_ingredient;
          dosage = medicine.dosage;
        };

        // Replace in medicines buffer (simplified approach - add updated version)
        medicines.add((medicine_id, updated_medicine));

        Debug.print("[ORDER]: Medicine order " # order_id # " placed for user " # user_id);

        return {
          success = true;
          order_id = ?order_id;
          message = "Order placed successfully. Total: $" # Float.toText(total_price);
          order = ?order;
          suggested_alternatives = null;
        };
      };
    };
  };

  // Get user medicine orders
  public shared query func get_user_medicine_orders(user_id : Text) : async [Types.MedicineOrder] {
    let user_orders = Buffer.Buffer<Types.MedicineOrder>(0);
    for ((_, order) in medicine_orders.vals()) {
      if (order.user_id == user_id) {
        user_orders.add(order);
      };
    };
    Buffer.toArray(user_orders);
  };

  // Get all available medicines (non-prescription, in stock)
  public shared query func get_available_medicines() : async Types.MedicineSearchResponse {
    let available_medicines = Buffer.Buffer<Types.Medicine>(0);
    for ((_, medicine) in medicines.vals()) {
      if (medicine.stock > 0 and not medicine.requires_prescription) {
        available_medicines.add(medicine);
      };
    };

    {
      medicines = Buffer.toArray(available_medicines);
      total_count = available_medicines.size();
      status = "success";
    };
  };

  // ----- Wellness Functions -----

  // Add a new wellness log
  public shared func add_wellness_log(log: Types.WellnessLog): async Types.StoreResponse {
    // Validate log data
    if (Text.size(log.user_id) == 0) {
      Debug.print("[ERROR]: Invalid user_id in wellness log");
      return {
        success = false;
        message = "Invalid user_id";
        id = null;
        logged_data = null;
      };
    };

    let id = "wellness_" # Nat.toText(next_id);
    wellness_logs.add((id, log));
    next_id += 1;
    Debug.print("[INFO]: Stored wellness log for user " # log.user_id # " on date " # log.date);

    return {
      success = true;
      message = "Wellness log stored successfully";
      id = ?id;
      logged_data = ?log;
    };
  };

  // Get wellness summary for a user
  public shared query func get_wellness_summary(user_id: Text, _days: Nat): async Types.SummaryResponse {
    let user_logs = Buffer.Buffer<Types.WellnessLog>(0);

    for ((_, log) in wellness_logs.vals()) {
      if (log.user_id == user_id) {
        user_logs.add(log);
      };
    };

    Debug.print("[INFO]: Found " # Nat.toText(user_logs.size()) # " logs for user " # user_id);

    return {
      logs = Buffer.toArray(user_logs);
      total_count = user_logs.size();
      success = true;
      message = "Successfully retrieved wellness logs";
    };
  };

  // ----- Private helper functions -----

  // Helper function to parse JSON text from blob
  private func parseJson(body: Blob): Result.Result<Text, Text> {
    switch (Text.decodeUtf8(body)) {
      case null { #err("Invalid UTF-8 encoding") };
      case (?text) { #ok(text) };
    };
  };

  // Extracts WellnessLog data from HTTP request body
  private func extractWellnessLogData(body: Blob): ?Types.WellnessLog {
    switch(parseJson(body)) {
      case (#err(e)) {
        Debug.print("[ERROR]: Failed to parse JSON: " # e);
        null
      };
      case (#ok(jsonText)) {
        let #ok(blob) = JSON.fromText(jsonText, null) else {
          Debug.print("[ERROR]: Invalid JSON format");
          return null;
        };

        let logData : ?Types.WellnessLog = from_candid (blob);
        logData;
      };
    };
  };

  // Extracts doctor data from HTTP request body
  private func extractDoctorData(body : Blob) : Result.Result<Types.Doctor, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let doctorData : ?Types.Doctor = from_candid (blob);

    switch (doctorData) {
      case null return #err("Doctor data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts appointment data from HTTP request body
  private func extractAppointmentData(body : Blob) : Result.Result<Types.Appointment, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let appointmentData : ?Types.Appointment = from_candid (blob);

    switch (appointmentData) {
      case null return #err("Appointment data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts specialty from HTTP request body
  private func extractSpecialty(body : Blob) : Result.Result<Text, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type SpecialtyRequest = {
      specialty : Text;
    };
    let specialtyRequest : ?SpecialtyRequest = from_candid (blob);

    switch (specialtyRequest) {
      case null return #err("Specialty not found in JSON");
      case (?req) #ok(req.specialty);
    };
  };

  // Extracts symptom data from HTTP request body
  private func extractSymptomData(body : Blob) : Result.Result<Types.SymptomData, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let symptomData : ?Types.SymptomData = from_candid (blob);

    switch (symptomData) {
      case null return #err("Symptom data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts medication reminder data from HTTP request body
  private func extractReminderData(body : Blob) : Result.Result<Types.MedicationReminder, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let reminderData : ?Types.MedicationReminder = from_candid (blob);

    switch (reminderData) {
      case null return #err("Reminder data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts emergency alert data from HTTP request body
  private func extractEmergencyData(body : Blob) : Result.Result<Types.EmergencyAlert, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let emergencyData : ?Types.EmergencyAlert = from_candid (blob);

    switch (emergencyData) {
      case null return #err("Emergency data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts user_id from HTTP request body
  private func extractUserId(body : Blob) : Result.Result<Text, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type UserRequest = {
      user_id : Text;
    };
    let userRequest : ?UserRequest = from_candid (blob);

    switch (userRequest) {
      case null return #err("User ID not found in JSON");
      case (?req) #ok(req.user_id);
    };
  };

  // Extracts user_id and optional days from wellness summary request
  private func extractWellnessSummaryRequest(body : Blob) : Result.Result<{user_id: Text; days: Nat}, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type WellnessSummaryRequest = {
      user_id : Text;
      days : ?Nat; // Make days optional
    };
    let summaryRequest : ?WellnessSummaryRequest = from_candid (blob);

    switch (summaryRequest) {
      case null return #err("user_id not found in JSON");
      case (?req) {
        // Return the user_id and the days value, defaulting to 7 if not provided
        #ok({ user_id = req.user_id; days = switch(req.days) { case null { 7 }; case (?d) { d }; }; });
      };
    };
  };

  // Extracts medicine data from HTTP request body
  private func extractMedicineData(body : Blob) : Result.Result<Types.Medicine, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    let medicineData : ?Types.Medicine = from_candid (blob);

    switch (medicineData) {
      case null return #err("Medicine data not found in JSON");
      case (?data) #ok(data);
    };
  };

  // Extracts medicine name from HTTP request body
  private func extractMedicineName(body : Blob) : Result.Result<Text, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type MedicineNameRequest = {
      medicine_name : Text;
    };
    let nameRequest : ?MedicineNameRequest = from_candid (blob);

    switch (nameRequest) {
      case null return #err("Medicine name not found in JSON");
      case (?req) #ok(req.medicine_name);
    };
  };

  // Extracts medicine category from HTTP request body
  private func extractMedicineCategory(body : Blob) : Result.Result<Text, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type MedicineCategoryRequest = {
      category : Text;
    };
    let categoryRequest : ?MedicineCategoryRequest = from_candid (blob);

    switch (categoryRequest) {
      case null return #err("Medicine category not found in JSON");
      case (?req) #ok(req.category);
    };
  };

  // Extracts medicine ID from HTTP request body
  private func extractMedicineId(body : Blob) : Result.Result<Text, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type MedicineIdRequest = {
      medicine_id : Text;
    };
    let idRequest : ?MedicineIdRequest = from_candid (blob);

    switch (idRequest) {
      case null return #err("Medicine ID not found in JSON");
      case (?req) #ok(req.medicine_id);
    };
  };

  // Extracts medicine order request from HTTP request body
  private func extractMedicineOrderRequest(body : Blob) : Result.Result<{medicine_id: Text; quantity: Nat; user_id: Text; prescription_id: ?Text}, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type MedicineOrderRequest = {
      medicine_id : Text;
      quantity : Nat;
      user_id : Text;
      prescription_id : ?Text;
    };
    let orderRequest : ?MedicineOrderRequest = from_candid (blob);

    switch (orderRequest) {
      case null return #err("Medicine order request not found in JSON");
      case (?req) #ok(req);
    };
  };

  // Constructs a JSON HTTP response using serde
  private func makeJsonResponse(statusCode : Nat16, jsonText : Text) : Types.HttpResponse {
    {
      status_code = statusCode;
      headers = [("content-type", "application/json"), ("access-control-allow-origin", "*")];
      body = Text.encodeUtf8(jsonText);
      streaming_strategy = null;
      upgrade = ?true;
    };
  };

  // Constructs a standardized error response for serialization failures
  private func makeSerializationErrorResponse() : Types.HttpResponse {
    {
      status_code = 500;
      headers = [("content-type", "application/json")];
      body = Text.encodeUtf8("{\"error\": \"Failed to serialize response\"}");
      streaming_strategy = null;
      upgrade = null;
    };
  };

  // Handles simple HTTP routes (GET/OPTIONS and fallback)
  private func handleRoute(method : Text, url : Text, _body : Blob) : Types.HttpResponse {
    let normalizedUrl = Text.trimEnd(url, #text "/");

    switch (method, normalizedUrl) {
      case ("GET", "" or "/") {
        let welcomeMsg = {
          message = "Welcome to the HealthCare Agent API";
        };
        let blob = to_candid (welcomeMsg);
        let #ok(jsonText) = JSON.toText(blob, WelcomeResponseKeys, null) else return makeSerializationErrorResponse();
        makeJsonResponse(200, jsonText);
      };
      case ("OPTIONS", _) {
        {
          status_code = 200;
          headers = [("access-control-allow-origin", "*"), ("access-control-allow-methods", "GET, POST, OPTIONS"), ("access-control-allow-headers", "Content-Type")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = null;
        };
      };
      case ("POST", "/store-symptoms" or "/store-reminder" or "/emergency-alert" or "/get-symptom-history" or "/get-reminders" or "/get-emergency-status" or "/store-doctor" or "/get-doctors-by-specialty" or "/store-appointment" or "/get-user-appointments" or "/update-appointment" or "/store-medicine" or "/search-medicines-by-name" or "/search-medicines-by-category" or "/get-medicine-by-id" or "/place-medicine-order" or "/get-user-medicine-orders" or "/get-available-medicines" or "/add-wellness-log" or "/get-wellness-summary") {
        {
          status_code = 200;
          headers = [("content-type", "application/json")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = ?true;
        };
      };
      case _ {
        {
          status_code = 404;
          headers = [("content-type", "application/json")];
          body = Text.encodeUtf8("Not found: " # url);
          streaming_strategy = null;
          upgrade = null;
        };
      };
    };
  };

  // Handles POST routes that require async update (e.g., calling other functions)
  private func handleRouteUpdate(method : Text, url : Text, body : Blob) : async Types.HttpResponse {
    let normalizedUrl = Text.trimEnd(url, #text "/");

    switch (method, normalizedUrl) {
      // Healthcare endpoints
      // Healthcare endpoints
      case ("POST", "/store-symptoms") {
        let symptomResult = extractSymptomData(body);
        switch (symptomResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(symptomData)) {
            let response = await store_symptoms(symptomData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, HealthStorageResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/store-reminder") {
        let reminderResult = extractReminderData(body);
        switch (reminderResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(reminderData)) {
            let response = await store_reminder(reminderData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, HealthStorageResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/emergency-alert") {
        let emergencyResult = extractEmergencyData(body);
        switch (emergencyResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(emergencyData)) {
            let response = await emergency_alert(emergencyData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, HealthStorageResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-symptom-history") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(userId)) {
            let response = await get_symptom_history(userId);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, SymptomHistoryResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-reminders") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(userId)) {
            let response = await get_reminders(userId);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, ReminderListResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-emergency-status") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(userId)) {
            let response = await get_emergency_status(userId);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, EmergencyStatusResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };

      // Doctor & Appointment endpoints
      case ("POST", "/store-doctor") {
        let doctorResult = extractDoctorData(body);
        switch (doctorResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(doctorData)) {
            let response = await store_doctor(doctorData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, HealthStorageResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-doctors-by-specialty") {
        let specialtyResult = extractSpecialty(body);
        switch (specialtyResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(specialty)) {
            let response = await get_doctors_by_specialty(specialty);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, DoctorSearchResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/store-appointment") {
        let appointmentResult = extractAppointmentData(body);
        switch (appointmentResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(appointmentData)) {
            let response = await store_appointment(appointmentData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, AppointmentResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-user-appointments") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(userId)) {
            let appointments = await get_user_appointments(userId);
            let blob = to_candid (appointments);
            let appointmentArrayKeys = ["appointment_id", "doctor_id", "doctor_name", "specialty", "patient_symptoms", "appointment_date", "appointment_time", "status", "urgency", "created_at", "user_id"];
            let #ok(jsonText) = JSON.toText(blob, appointmentArrayKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };

      // Medicine & Pharmacy endpoints
      case ("POST", "/store-medicine") {
        let medicineResult = extractMedicineData(body);
        switch (medicineResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(medicineData)) {
            let response = await store_medicine(medicineData);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, HealthStorageResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/search-medicines-by-name") {
        let nameResult = extractMedicineName(body);
        switch (nameResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(medicineName)) {
            let response = await search_medicines_by_name(medicineName);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, MedicineSearchResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/search-medicines-by-category") {
        let categoryResult = extractMedicineCategory(body);
        switch (categoryResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(category)) {
            let response = await search_medicines_by_category(category);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, MedicineSearchResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-medicine-by-id") {
        let medicineIdResult = extractMedicineId(body);
        switch (medicineIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(medicineId)) {
            let response = await get_medicine_by_id(medicineId);
            switch (response) {
              case null {
                makeJsonResponse(404, "{\"error\": \"Medicine not found\"}");
              };
              case (?inventory) {
                let blob = to_candid (inventory);
                let #ok(jsonText) = JSON.toText(blob, PharmacyInventoryResponseKeys, null) else return makeSerializationErrorResponse();
                makeJsonResponse(200, jsonText);
              };
            };
          };
        };
      };
      case ("POST", "/place-medicine-order") {
        let orderResult = extractMedicineOrderRequest(body);
        switch (orderResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(orderRequest)) {
            let response = await place_medicine_order(orderRequest.medicine_id, orderRequest.quantity, orderRequest.user_id, orderRequest.prescription_id);
            let blob = to_candid (response);
            let #ok(jsonText) = JSON.toText(blob, MedicineOrderResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-user-medicine-orders") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(userId)) {
            let orders = await get_user_medicine_orders(userId);
            let blob = to_candid (orders);
            let orderArrayKeys = ["order_id", "medicine_id", "medicine_name", "quantity", "unit_price", "total_price", "user_id", "order_date", "status", "prescription_id", "pharmacy_notes"];
            let #ok(jsonText) = JSON.toText(blob, orderArrayKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-available-medicines") {
        let response = await get_available_medicines();
        let blob = to_candid (response);
        let #ok(jsonText) = JSON.toText(blob, MedicineSearchResponseKeys, null) else return makeSerializationErrorResponse();
        makeJsonResponse(200, jsonText);
      };

      // Wellness endpoints
      case ("POST", "/add-wellness-log") {
        let logData = extractWellnessLogData(body);
        switch(logData) {
          case null {
            makeJsonResponse(400, "{\"error\": \"Invalid wellness log data\"}");
          };
          case (?log) {
            let response = await add_wellness_log(log);
            let blob = to_candid(response);
            let #ok(jsonText) = JSON.toText(blob, WellnessStoreResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };

      case ("POST", "/get-wellness-summary") {
        let requestResult = extractWellnessSummaryRequest(body);
        switch (requestResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(requestData)) {
            let response = await get_wellness_summary(requestData.user_id, requestData.days);
            let blob = to_candid(response);
            let #ok(jsonText) = JSON.toText(blob, WellnessSummaryResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("OPTIONS", _) {
        {
          status_code = 200;
          headers = [("access-control-allow-origin", "*"), ("access-control-allow-methods", "GET, POST, OPTIONS"), ("access-control-allow-headers", "Content-Type")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = null;
        };
      };
      case _ {
        return handleRoute(method, url, body);
      };
    };
  };

  // HTTP query interface for GET/OPTIONS and static responses
  public query func http_request(req : Types.HttpRequest) : async Types.HttpResponse {
    return handleRoute(req.method, req.url, req.body);
  };

  // HTTP update interface for POST routes requiring async calls
  public func http_request_update(req : Types.HttpRequest) : async Types.HttpResponse {
    return await handleRouteUpdate(req.method, req.url, req.body);
  };
};