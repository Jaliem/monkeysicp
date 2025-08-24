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
import Array "mo:base/Array";
import Order "mo:base/Order";
import Iter "mo:base/Iter";
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
  transient let WellnessSummaryResponseKeys = ["logs", "total_count", "success", "message", "streak"];
  transient let _UserStreakKeys = ["user_id", "current_streak", "longest_streak", "last_log_date", "updated_at"];

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

  // User Profile JSON keys
  transient let _UserProfileKeys = ["user_id", "name", "age", "gender", "height", "weight", "blood_type", "phone_number", "emergency_contact", "allergies", "medications", "conditions", "surgeries", "preferred_doctor", "preferred_pharmacy", "privacy_level", "created_at", "updated_at"];
  transient let UserProfileResponseKeys = ["success", "message", "profile"];

  // Healthcare data storage
  private var symptom_entries : [(Text, Types.SymptomData)] = [];
  private var medication_reminders : [(Text, Types.MedicationReminder)] = [];
  private var emergency_alerts : [(Text, Types.EmergencyAlert)] = [];
  private var doctor_entries : [(Text, Types.Doctor)] = [];
  private var appointment_entries : [(Text, Types.Appointment)] = [];
  private var wellness_log_entries : [(Text, Types.WellnessLog)] = [];
  private var streak_entries : [(Text, Types.UserStreak)] = [];
  private var medicine_entries : [(Text, Types.Medicine)] = [];
  private var medicine_order_entries : [(Text, Types.MedicineOrder)] = [];
  private var next_id : Nat = 1;

  private transient var symptoms = Buffer.Buffer<(Text, Types.SymptomData)>(0);
  private transient var reminders = Buffer.Buffer<(Text, Types.MedicationReminder)>(0);
  private transient var emergencies = Buffer.Buffer<(Text, Types.EmergencyAlert)>(0);
  private transient var doctors = Buffer.Buffer<(Text, Types.Doctor)>(0);
  private transient var appointments = Buffer.Buffer<(Text, Types.Appointment)>(0);
  private transient var wellness_logs = Buffer.Buffer<(Text, Types.WellnessLog)>(0);
  private transient var user_streaks = Buffer.Buffer<(Text, Types.UserStreak)>(0);
  private transient var medicines = Buffer.Buffer<(Text, Types.Medicine)>(0);
  private transient var medicine_orders = Buffer.Buffer<(Text, Types.MedicineOrder)>(0);
  private transient var user_profiles = Buffer.Buffer<(Text, Types.UserProfile)>(0);
  private var user_profile_entries : [(Text, Types.UserProfile)] = [];

  system func preupgrade() {
    symptom_entries := Buffer.toArray(symptoms);
    medication_reminders := Buffer.toArray(reminders);
    emergency_alerts := Buffer.toArray(emergencies);
    doctor_entries := Buffer.toArray(doctors);
    appointment_entries := Buffer.toArray(appointments);
    wellness_log_entries := Buffer.toArray(wellness_logs);
    streak_entries := Buffer.toArray(user_streaks);
    medicine_entries := Buffer.toArray(medicines);
    medicine_order_entries := Buffer.toArray(medicine_orders);
    user_profile_entries := Buffer.toArray(user_profiles);
  };

  system func postupgrade() {
    symptoms := Buffer.fromArray(symptom_entries);
    reminders := Buffer.fromArray(medication_reminders);
    emergencies := Buffer.fromArray(emergency_alerts);
    doctors := Buffer.fromArray(doctor_entries);
    appointments := Buffer.fromArray(appointment_entries);
    wellness_logs := Buffer.fromArray(wellness_log_entries);
    user_streaks := Buffer.fromArray(streak_entries);
    medicines := Buffer.fromArray(medicine_entries);
    medicine_orders := Buffer.fromArray(medicine_order_entries);
    user_profiles := Buffer.fromArray(user_profile_entries);
    symptom_entries := [];
    medication_reminders := [];
    emergency_alerts := [];
    streak_entries := [];

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
        image_url = "https://media.istockphoto.com/id/177373093/photo/indian-male-doctor.jpg?s=612x612&w=0&k=20&c=5FkfKdCYERkAg65cQtdqeO_D0JMv6vrEdPw3mX1Lkfg=";
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
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-KjqUO12bNZqGpsdh6gU0DUmz3f3-Pj5ikJYYqb5w8A789NqtMnEmVf6Fo0AqoXJOfcY&usqp=CAU";
    };
    doctors.add(("card_002", card2));

    // DERMATOLOGY DOCTORS
    let derm1 : Types.Doctor = {
        doctor_id = "derm_001";
        name = "Dr. Isabella Rodriguez";
        specialty = "Dermatology";
        qualifications = "MD, FAAD";
        experience_years = 11;
        rating = 4.6;
        available_days = ["Monday", "Tuesday", "Thursday"];
        available_slots = ["08:00", "10:00", "14:00", "16:00"];
        image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
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
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYgoNUGdTXgbbapdy3wq9WPJYj9UxpkcVwnwxD9M_fvkR-nwQIY57c8TguRer6Cshtcnw&usqp=CAU";
    };
    doctors.add(("derm_002", derm2));

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
        image_url = "https://media.istockphoto.com/id/469603848/photo/mature-medical-doctor.jpg?s=612x612&w=0&k=20&c=tvCH8hG-O3GQrwo-Zd0YdQgjSWgW_Mn9DJPLODKKUrE=";
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
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwoLR-bBo8Y92cKLK7QQ61MPdYffu7sJCxdQBhMy5zk5RedIVAsV8ON8LgBKqgwFyLQEE&usqp=CAU";
    };
    doctors.add(("neuro_002", neuro2));

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
        image_url = "https://i.pinimg.com/474x/c5/a3/90/c5a3904b38eb241dd03dd30889599dc4.jpg";
    };
    doctors.add(("ortho_002", ortho2));

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
        image_url = "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face";
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
        image_url = "https://img.freepik.com/free-photo/female-doctor-hospital-with-stethoscope_23-2148827774.jpg?semt=ais_hybrid&w=740&q=80";
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
        image_url = "https://st2.depositphotos.com/1930953/5700/i/450/depositphotos_57007925-Asian-doctor.jpg";
    };
    doctors.add(("pedia_003", pedia3));

    // PSYCHIATRY DOCTORS
    let psych1 : Types.Doctor = {
        doctor_id = "psych_001";
        name = "Dr. Vellyn Angeline";
        specialty = "Psychiatry";
        qualifications = "MD, FAPA";
        experience_years = 11;
        rating = 4.6;
        available_days = ["Tuesday", "Thursday"];
        available_slots = ["09:15", "11:15", "13:15"];
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBPtP4JyvRQ3P8KvuY4AOcxF97MTZ3Tph9sw&s";
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
        image_url = "https://www.shutterstock.com/image-photo/profile-picture-smiling-old-male-600nw-1769847965.jpg";
    };
    doctors.add(("psych_002", psych2));

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
        image_url = "https://t4.ftcdn.net/jpg/07/07/89/33/360_F_707893394_5DEhlBjWOmse1nyu0rC9T7ZRvsAFDkYC.jpg";
    };
    doctors.add(("onco_001", onco1));

    let onco2 : Types.Doctor = {
        doctor_id = "onco_002";
        name = "Dr. Gisella Jayata";
        specialty = "Oncology";
        qualifications = "MD, FACP, FASCO";
        experience_years = 17;
        rating = 4.8;
        available_days = ["Tuesday", "Thursday"];
        available_slots = ["09:00", "12:00", "15:00"];
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI3lsxUqYV0T-Tsp3ZsrqAvw5KAmjxXrpThsCXVO_0sRlbyprZqg40YeUYV8Uth6zpH04&usqp=CAU";
    };
    doctors.add(("onco_002", onco2));

    // GENERAL PRACTITIONER DOCTORS
    let gp1 : Types.Doctor = {
        doctor_id = "gp_001";
        name = "Dr. Dylan Lorrenzo";
        specialty = "General Practitioner";
        qualifications = "MD, AAFP";
        experience_years = 7;
        rating = 4.4;
        available_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        available_slots = ["08:30", "10:30", "12:30", "14:30"];
        image_url = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face";
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
        image_url = "https://thumbs.dreamstime.com/b/passionate-helping-patients-headshot-portrait-profile-picture-social-networks-successful-professional-young-female-doctor-356873660.jpg";
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
        image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBIr4N0-Wyj91VvwOvhiZ5-uJgjkbiPA5xOA&s";
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
        image_url = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face";
    };
    doctors.add(("gp_004", gp4));
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
      image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-U37LqNIOtq4U_YL3av1GAe82pnGScVAvpw&s";
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
      image_url = "https://www.medicinedirect.co.uk/media/catalog/product/cache/8bf3693ed458c257f5171ffffa4e8921/2/2/220-4956.jpg";
    };
    medicines.add(("med_002", ibuprofen));

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
      image_url = "https://wellonapharma.com/admincms/product_img/product_resize_img/amoxicillin-tablets_1732540129.jpg";
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
      image_url = "https://www.krishlarpharma.com/wp-content/uploads/2019/12/KRITHRO-250-tablet.jpg";
    };
    medicines.add(("med_006", azithromycin));

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
      image_url = "https://res-3.cloudinary.com/dk0z4ums3/image/upload/c_scale,h_500,w_500/v1/production/pharmacy/products/1725758008_vitamin_c_50_mg_10_tablet_afi";
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
      image_url = "https://images-na.ssl-images-amazon.com/images/I/41+gy0zbsoL._UL500_.jpg";
    };
    medicines.add(("med_010", vitamin_d));

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
      image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_ichWgyH_Bgza9APX_I_MpCfqx6YJeShrKA&s";
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
      image_url = "https://cdn.foxpharma.co.uk/wp-content/uploads/2024/09/Cetirizine-10mg.jpg";
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
      image_url = "https://img-cdn.medkomtek.com/5h5Njal6c6LwZEADBmd0MOY9U90=/fit-in/690x387/smart/filters:quality(100):strip_icc():format(webp)/drugs/hHOd529y8FfZPTV1F6DqQ/original/OBT0008473.jpg";
    };
    medicines.add(("med_015", loratadine));

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
      image_url = "https://www.shielddrugstore.com/web/image/product.template/27768/image_1024?unique=97ba552";
    };
    medicines.add(("med_018", insulin));

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
      image_url = "https://www.medsforless.co.uk/wp-content/uploads/2025/04/metformin_sr.jpg";
    };
    medicines.add(("med_020", metformin));

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
      image_url = "https://www.simplymedsonline.co.uk/storage/products/5746/images/lisinopril-tablets-es-31654603359.webp";
    };
    medicines.add(("med_022", lisinopril));

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
      image_url = "https://medias.watsons.com.ph/publishing/WTCPH-10059639-front-zoom.jpg?version=1721929924";
    };
    medicines.add(("med_026", sertraline));

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
      image_url = "https://5.imimg.com/data5/SELLER/Default/2024/2/386108659/PC/IV/YU/195334035/omeprazole-capsules-ip.jpg";
    };
    medicines.add(("med_029", omeprazole));
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
    next_id := next_id + 1;
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
    next_id := next_id + 1;
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
    next_id := next_id + 1;
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
    next_id := next_id + 1;
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
    next_id := next_id + 1;
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
    next_id := next_id + 1;
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
        next_id := next_id + 1;
        Debug.print("[ORDER]: Medicine order stored with ID: " # order_storage_id # " for user: " # user_id);

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
          image_url = medicine.image_url;
        };

        // Update medicine stock in the buffer by finding and replacing the entry
        let medicines_temp = Buffer.Buffer<(Text, Types.Medicine)>(medicines.size());
        var found_and_updated = false;
        
        for ((id, med) in medicines.vals()) {
          if (med.medicine_id == medicine_id) {
            medicines_temp.add((id, updated_medicine));
            found_and_updated := true;
          } else {
            medicines_temp.add((id, med));
          };
        };
        
        // If medicine wasn't found in buffer, add it (shouldn't happen but safety check)
        if (not found_and_updated) {
          medicines_temp.add((medicine_id, updated_medicine));
        };
        
        // Replace the medicines buffer with updated one
        medicines := medicines_temp;

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
    Debug.print("[ORDER_QUERY]: Fetching orders for user: " # user_id);
    Debug.print("[ORDER_QUERY]: Total orders in system: " # Nat.toText(medicine_orders.size()));
    
    let user_orders = Buffer.Buffer<Types.MedicineOrder>(0);
    for ((id, order) in medicine_orders.vals()) {
      Debug.print("[ORDER_QUERY]: Checking order " # id # " for user " # order.user_id);
      if (order.user_id == user_id) {
        user_orders.add(order);
        Debug.print("[ORDER_QUERY]: Found matching order: " # order.order_id);
      };
    };
    
    Debug.print("[ORDER_QUERY]: Found " # Nat.toText(user_orders.size()) # " orders for user " # user_id);
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

    // Always create new entry (allow multiple logs per day)
    let id = "wellness_" # Nat.toText(next_id);
    wellness_logs.add((id, log));
    next_id := next_id + 1;
    Debug.print("[INFO]: Created new wellness log for user " # log.user_id # " on date " # log.date);

    // Update user streak after adding log
    ignore calculateAndUpdateStreak(log.user_id);

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

    // Get user streak data
    let user_streak = do ? {
      for ((_, streak) in user_streaks.vals()) {
        if (streak.user_id == user_id) {
          return ?streak;
        };
      };
      null
    };

    return {
      logs = Buffer.toArray(user_logs);
      total_count = user_logs.size();
      success = true;
      message = "Successfully retrieved wellness logs";
      streak = user_streak;
    };
  };

  // Delete wellness log by date for a user
  public shared func delete_wellness_log(user_id: Text, date: Text): async Types.StoreResponse {
    if (Text.size(user_id) == 0 or Text.size(date) == 0) {
      return {
        success = false;
        message = "Invalid user_id or date";
        id = null;
        logged_data = null;
      };
    };

    var found = false;
    let logs_temp = Buffer.Buffer<(Text, Types.WellnessLog)>(wellness_logs.size());
    var deleted_log: ?Types.WellnessLog = null;

    label search for ((id, log) in wellness_logs.vals()) {
      if (log.user_id == user_id and log.date == date) {
        found := true;
        deleted_log := ?log;
        Debug.print("[DELETE]: Removed wellness log for user " # user_id # " on date " # date);
      } else {
        logs_temp.add((id, log));
      };
    };

    if (found) {
      // Replace the buffer with filtered logs
      wellness_logs := logs_temp;
      
      // Update user streak after deleting log
      ignore calculateAndUpdateStreak(user_id);
      
      return {
        success = true;
        message = "Wellness log deleted successfully";
        id = null;
        logged_data = deleted_log;
      };
    } else {
      return {
        success = false;
        message = "No wellness log found for the specified date";
        id = null;
        logged_data = null;
      };
    };
  };

  // Calculate and update user streak
  private func calculateAndUpdateStreak(user_id: Text): async () {
    // Get all user's wellness logs sorted by date (newest first)
    let user_logs = Buffer.Buffer<Types.WellnessLog>(0);
    for ((_, log) in wellness_logs.vals()) {
      if (log.user_id == user_id) {
        user_logs.add(log);
      };
    };

    // Convert to array and sort by date (newest first)
    let logs_array = Buffer.toArray(user_logs);
    let sorted_logs = Array.sort(logs_array, func(a: Types.WellnessLog, b: Types.WellnessLog): Order.Order {
      Text.compare(b.date, a.date)
    });

    if (sorted_logs.size() == 0) {
      // No logs, set streak to 0
      await updateUserStreak(user_id, 0, 0, "", getCurrentTimestamp());
      return;
    };

    // Calculate current streak
    var current_streak: Nat = 0;
    var longest_streak: Nat = 0;
    var temp_streak: Nat = 0;
    let today = getCurrentDate();
    var check_date = today;
    
    // Check if logged today
    let has_logged_today = Array.find<Types.WellnessLog>(sorted_logs, func(log) { log.date == today });
    
    // If not logged today, start from yesterday
    if (has_logged_today == null) {
      check_date := getPreviousDate(today);
    };

    // Count consecutive days backwards
    var date_to_check = check_date;
    label streak_loop for (i in Iter.range(0, 364)) { // Max 365 days
      let found_log = Array.find<Types.WellnessLog>(sorted_logs, func(log) { log.date == date_to_check });
      if (found_log != null) {
        current_streak += 1;
        temp_streak += 1;
        if (temp_streak > longest_streak) {
          longest_streak := temp_streak;
        };
      } else {
        break streak_loop;
      };
      date_to_check := getPreviousDate(date_to_check);
    };

    // Calculate longest streak from all logs
    let dates_only = Array.map<Types.WellnessLog, Text>(sorted_logs, func(log) { log.date });
    let sorted_dates = Array.sort(dates_only, Text.compare);
    
    temp_streak := 0;
    var i = 0;
    while (i < sorted_dates.size()) {
      var current_temp_streak = 1;
      var check_date_for_longest = sorted_dates[i];
      var j = i + 1;
      
      // Count consecutive dates forward
      while (j < sorted_dates.size()) {
        let next_expected = getNextDate(check_date_for_longest);
        if (j < sorted_dates.size() and sorted_dates[j] == next_expected) {
          current_temp_streak += 1;
          check_date_for_longest := next_expected;
          j += 1;
        } else {
          j := sorted_dates.size(); // Break the loop
        };
      };
      
      if (current_temp_streak > longest_streak) {
        longest_streak := current_temp_streak;
      };
      
      i += 1;
    };

    let last_log_date = if (sorted_logs.size() > 0) { sorted_logs[0].date } else { "" };
    await updateUserStreak(user_id, current_streak, longest_streak, last_log_date, getCurrentTimestamp());
  };

  // Update or create user streak record
  private func updateUserStreak(user_id: Text, current: Nat, longest: Nat, last_date: Text, updated: Text): async () {
    // Remove existing streak record for user
    let streaks_temp = Buffer.Buffer<(Text, Types.UserStreak)>(user_streaks.size());
    for ((id, streak) in user_streaks.vals()) {
      if (streak.user_id != user_id) {
        streaks_temp.add((id, streak));
      };
    };
    user_streaks := streaks_temp;

    // Add new streak record
    let new_streak: Types.UserStreak = {
      user_id = user_id;
      current_streak = current;
      longest_streak = longest;
      last_log_date = last_date;
      updated_at = updated;
    };
    let streak_id = "streak_" # user_id;
    user_streaks.add((streak_id, new_streak));
  };

  // Get user streak data
  public query func get_user_streak(user_id: Text): async ?Types.UserStreak {
    for ((_, streak) in user_streaks.vals()) {
      if (streak.user_id == user_id) {
        return ?streak;
      };
    };
    null
  };

  // Helper function to get current date in YYYY-MM-DD format
  private func getCurrentDate(): Text {
    // For now, we'll use a simplified approach
    // In production, you would want proper date handling
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    // Convert to days since epoch and format as date
    let days_since_epoch = seconds / 86400; // 86400 seconds in a day
    let days_since_2024 = days_since_epoch - 19723; // Days from epoch to 2024-01-01
    let year = 2024 + (days_since_2024 / 365);
    let day_of_year = days_since_2024 % 365;
    let month = (day_of_year / 30) + 1; // Simplified month calculation
    let day = (day_of_year % 30) + 1;
    Nat.toText(year) # "-" # 
    (if (month < 10) { "0" } else { "" }) # Nat.toText(month) # "-" #
    (if (day < 10) { "0" } else { "" }) # Nat.toText(day)
  };

  // Helper function to get previous date (simplified but functional)
  private func getPreviousDate(date: Text): Text {
    // Simple date parsing and manipulation
    // Input format: "YYYY-MM-DD"
    let parts = Text.split(date, #char '-');
    let partsArray = Iter.toArray(parts);
    
    if (partsArray.size() != 3) return date; // Return original if invalid format
    
    let yearText = partsArray[0];
    let monthText = partsArray[1];
    let dayText = partsArray[2];
    
    // Convert to numbers
    let year = switch (Nat.fromText(yearText)) { case (?n) n; case null return date; };
    let month = switch (Nat.fromText(monthText)) { case (?n) n; case null return date; };
    let day = switch (Nat.fromText(dayText)) { case (?n) n; case null return date; };
    
    // Simple previous day logic
    var newYear = year;
    var newMonth = month;
    var newDay = day;
    
    if (day > 1) {
      newDay := day - 1;
    } else {
      // Go to previous month
      if (month > 1) {
        newMonth := month - 1;
        newDay := 30; // Simplified - assume 30 days per month
      } else {
        // Go to previous year
        newYear := year - 1;
        newMonth := 12;
        newDay := 31;
      };
    };
    
    // Format back to string
    Nat.toText(newYear) # "-" # 
    (if (newMonth < 10) { "0" } else { "" }) # Nat.toText(newMonth) # "-" #
    (if (newDay < 10) { "0" } else { "" }) # Nat.toText(newDay)
  };

  // Helper function to get next date (for longest streak calculation)
  private func getNextDate(date: Text): Text {
    // Simple date parsing and manipulation
    // Input format: "YYYY-MM-DD"
    let parts = Text.split(date, #char '-');
    let partsArray = Iter.toArray(parts);
    
    if (partsArray.size() != 3) return date; // Return original if invalid format
    
    let yearText = partsArray[0];
    let monthText = partsArray[1];
    let dayText = partsArray[2];
    
    // Convert to numbers
    let year = switch (Nat.fromText(yearText)) { case (?n) n; case null return date; };
    let month = switch (Nat.fromText(monthText)) { case (?n) n; case null return date; };
    let day = switch (Nat.fromText(dayText)) { case (?n) n; case null return date; };
    
    // Simple next day logic
    var newYear = year;
    var newMonth = month;
    var newDay = day;
    
    if (day < 28) { // Safe for all months
      newDay := day + 1;
    } else if (day < 30) {
      newDay := day + 1;
    } else if (day == 30 and month != 2) {
      newDay := day + 1;
    } else {
      // Go to next month
      if (month < 12) {
        newMonth := month + 1;
        newDay := 1;
      } else {
        // Go to next year
        newYear := year + 1;
        newMonth := 1;
        newDay := 1;
      };
    };
    
    // Format back to string
    Nat.toText(newYear) # "-" # 
    (if (newMonth < 10) { "0" } else { "" }) # Nat.toText(newMonth) # "-" #
    (if (newDay < 10) { "0" } else { "" }) # Nat.toText(newDay)
  };

  // Helper function to get current timestamp
  private func getCurrentTimestamp(): Text {
    let now = Time.now();
    Int.toText(now)
  };

  // ----- Cancel Functions -----

  // Cancel doctor appointment
  public shared func cancel_appointment(appointment_id: Text, user_id: Text): async Types.CancelResponse {
    Debug.print("[CANCEL]: Attempting to cancel appointment " # appointment_id # " for user " # user_id);
    
    var found = false;
    let appointments_temp = Buffer.Buffer<(Text, Types.Appointment)>(appointments.size());
    
    for ((id, appointment) in appointments.vals()) {
      if (appointment.appointment_id == appointment_id and appointment.user_id == user_id) {
        // Update appointment status to cancelled
        let cancelled_appointment: Types.Appointment = {
          appointment_id = appointment.appointment_id;
          doctor_id = appointment.doctor_id;
          doctor_name = appointment.doctor_name;
          specialty = appointment.specialty;
          patient_symptoms = appointment.patient_symptoms;
          appointment_date = appointment.appointment_date;
          appointment_time = appointment.appointment_time;
          status = "cancelled";
          urgency = appointment.urgency;
          created_at = appointment.created_at;
          user_id = appointment.user_id;
        };
        appointments_temp.add((id, cancelled_appointment));
        found := true;
        Debug.print("[CANCEL]: Appointment " # appointment_id # " cancelled successfully");
      } else {
        appointments_temp.add((id, appointment));
      };
    };
    
    if (found) {
      appointments := appointments_temp;
      return {
        success = true;
        message = "Appointment cancelled successfully";
        cancelled_id = ?appointment_id;
      };
    } else {
      return {
        success = false;
        message = "Appointment not found or you don't have permission to cancel it";
        cancelled_id = null;
      };
    };
  };

  // Cancel medicine order
  public shared func cancel_medicine_order(order_id: Text, user_id: Text): async Types.CancelResponse {
    Debug.print("[CANCEL]: Attempting to cancel order " # order_id # " for user " # user_id);
    
    var found = false;
    let orders_temp = Buffer.Buffer<(Text, Types.MedicineOrder)>(medicine_orders.size());
    
    for ((id, order) in medicine_orders.vals()) {
      if (order.order_id == order_id and order.user_id == user_id) {
        // Only allow cancellation if order is not already shipped/delivered
        if (order.status == "confirmed") {
          // Update order status to cancelled and restore medicine stock
          let cancelled_order: Types.MedicineOrder = {
            order_id = order.order_id;
            medicine_id = order.medicine_id;
            medicine_name = order.medicine_name;
            quantity = order.quantity;
            unit_price = order.unit_price;
            total_price = order.total_price;
            user_id = order.user_id;
            order_date = order.order_date;
            status = "cancelled";
            prescription_id = order.prescription_id;
            pharmacy_notes = ?"Order cancelled by user request";
          };
          
          // Restore medicine stock
          let medicines_temp = Buffer.Buffer<(Text, Types.Medicine)>(medicines.size());
          for ((med_id, medicine) in medicines.vals()) {
            if (medicine.medicine_id == order.medicine_id) {
              let updated_medicine: Types.Medicine = {
                medicine_id = medicine.medicine_id;
                name = medicine.name;
                generic_name = medicine.generic_name;
                category = medicine.category;
                stock = medicine.stock + order.quantity; // Restore stock
                price = medicine.price;
                manufacturer = medicine.manufacturer;
                description = medicine.description;
                requires_prescription = medicine.requires_prescription;
                active_ingredient = medicine.active_ingredient;
                dosage = medicine.dosage;
                image_url = medicine.image_url;
              };
              medicines_temp.add((med_id, updated_medicine));
            } else {
              medicines_temp.add((med_id, medicine));
            };
          };
          medicines := medicines_temp;
          
          orders_temp.add((id, cancelled_order));
          found := true;
          Debug.print("[CANCEL]: Order " # order_id # " cancelled successfully, stock restored");
        } else {
          return {
            success = false;
            order_id = null;
            message = "Order cannot be cancelled (status: " # order.status # ")";
            order = null;
            suggested_alternatives = null;
          };
        };
      } else {
        orders_temp.add((id, order));
      };
    };
    
    if (found) {
      medicine_orders := orders_temp;
      return {
        success = true;
        message = "Order cancelled successfully and stock restored";
        cancelled_id = ?order_id;
      };
    } else {
      return {
        success = false;
        message = "Order not found or you don't have permission to cancel it";
        cancelled_id = null;
      };
    };
  };

  // ----- User Profile functions -----

  // Store or update user profile
  public shared func store_user_profile(profile : Types.UserProfile) : async Types.UserProfileResponse {
    Debug.print("[USER_PROFILE]: Storing profile for user " # profile.user_id);
    
    // Check if profile already exists and update it
    var found = false;
    var profileIndex : ?Nat = null;
    var i = 0;
    for ((id, existing_profile) in user_profiles.vals()) {
      if (existing_profile.user_id == profile.user_id) {
        found := true;
        profileIndex := ?i;
      };
      i += 1;
    };
    
    if (found) {
      // Update existing profile
      switch (profileIndex) {
        case (?index) {
          let (id, _) = user_profiles.get(index);
          user_profiles.put(index, (id, profile));
          Debug.print("[USER_PROFILE]: Updated existing profile for user " # profile.user_id);
        };
        case null {};
      };
    } else {
      // Create new profile
      let id = "profile_" # Int.toText(next_id);
      user_profiles.add((id, profile));
      next_id := next_id + 1;
      Debug.print("[USER_PROFILE]: Created new profile for user " # profile.user_id);
    };
    
    {
      success = true;
      message = if (found) "User profile updated successfully" else "User profile created successfully";
      profile = ?profile;
    }
  };

  // Get user profile by user_id
  public shared query func get_user_profile(user_id : Text) : async Types.UserProfileResponse {
    Debug.print("[USER_PROFILE]: Fetching profile for user " # user_id);
    
    for ((_, profile) in user_profiles.vals()) {
      if (profile.user_id == user_id) {
        Debug.print("[USER_PROFILE]: Found profile for user " # user_id);
        return {
          success = true;
          message = "User profile retrieved successfully";
          profile = ?profile;
        };
      };
    };
    
    Debug.print("[USER_PROFILE]: No profile found for user " # user_id);
    {
      success = false;
      message = "User profile not found";
      profile = null;
    }
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
        Debug.print("[DEBUG]: Received wellness JSON: " # jsonText);
        let #ok(blob) = JSON.fromText(jsonText, null) else {
          Debug.print("[ERROR]: Invalid JSON format");
          return null;
        };

        let logData : ?Types.WellnessLog = from_candid (blob);
        switch(logData) {
          case null {
            Debug.print("[ERROR]: from_candid returned null for wellness log");
          };
          case (?log) {
            Debug.print("[DEBUG]: Successfully parsed wellness log - user: " # log.user_id # ", date: " # log.date);
            Debug.print("[DEBUG]: Sleep value: " # (switch(log.sleep) { case null { "null" }; case (?s) { Float.toText(s) } }));
            Debug.print("[DEBUG]: Water value: " # (switch(log.water_intake) { case null { "null" }; case (?w) { Float.toText(w) } }));
            Debug.print("[DEBUG]: Steps value: " # (switch(log.steps) { case null { "null" }; case (?st) { Nat.toText(st) } }));
          };
        };
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

  // Extracts user_id and date from delete wellness request
  private func extractDeleteWellnessRequest(body : Blob) : Result.Result<{user_id: Text; date: Text}, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };

    type DeleteWellnessRequest = {
      user_id : Text;
      date : Text;
    };
    let deleteRequest : ?DeleteWellnessRequest = from_candid (blob);

    switch (deleteRequest) {
      case null return #err("user_id or date not found in JSON");
      case (?req) {
        #ok({ user_id = req.user_id; date = req.date });
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

  // Extracts appointment_id/order_id and user_id from cancel request body
  private func extractCancelRequest(body : Blob) : ?(Text, Text) {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return null };
      case (?txt) { txt };
    };

    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return null;
    };

    type CancelRequest = {
      appointment_id : ?Text;
      order_id : ?Text; 
      user_id : Text;
    };
    let cancelRequest : ?CancelRequest = from_candid (blob);

    switch (cancelRequest) {
      case null { null };
      case (?req) {
        // Support both appointment_id and order_id fields
        let id = switch(req.appointment_id) {
          case (?id) { id };
          case null {
            switch(req.order_id) {
              case (?id) { id };
              case null { return null };
            };
          };
        };
        ?(id, req.user_id);
      };
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
      case ("POST", "/store-symptoms" or "/store-reminder" or "/emergency-alert" or "/get-symptom-history" or "/get-reminders" or "/get-emergency-status" or "/store-doctor" or "/get-doctors-by-specialty" or "/store-appointment" or "/get-user-appointments" or "/update-appointment" or "/store-medicine" or "/search-medicines-by-name" or "/search-medicines-by-category" or "/get-medicine-by-id" or "/place-medicine-order" or "/get-user-medicine-orders" or "/get-available-medicines" or "/cancel-appointment" or "/cancel-medicine-order" or "/add-wellness-log" or "/get-wellness-summary" or "/delete-wellness-log" or "/store-user-profile" or "/get-user-profile") {
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

  private func extractUserProfile(body : Blob) : Result.Result<Types.UserProfile, Text> {
    let jsonText = switch (Text.decodeUtf8(body)) {
      case null { return #err("Invalid UTF-8 encoding in request body") };
      case (?txt) { txt };
    };
    let #ok(blob) = JSON.fromText(jsonText, null) else {
      return #err("Invalid JSON format in request body");
    };
    let profile : ?Types.UserProfile = from_candid (blob);
    switch (profile) {
      case null return #err("User profile data not found in JSON");
      case (?p) #ok(p);
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

      // Cancel endpoints
      case ("POST", "/cancel-appointment") {
        let cancelRequest = extractCancelRequest(body);
        switch(cancelRequest) {
          case null {
            makeJsonResponse(400, "{\"error\": \"Invalid cancel request data. Required: appointment_id, user_id\"}");
          };
          case (?(appointment_id, user_id)) {
            let response = await cancel_appointment(appointment_id, user_id);
            let blob = to_candid(response);
            let cancelResponseKeys = ["success", "message", "cancelled_id"];
            let #ok(jsonText) = JSON.toText(blob, cancelResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/cancel-medicine-order") {
        let cancelRequest = extractCancelRequest(body);
        switch(cancelRequest) {
          case null {
            makeJsonResponse(400, "{\"error\": \"Invalid cancel request data. Required: order_id (as appointment_id), user_id\"}");
          };
          case (?(order_id, user_id)) {
            let response = await cancel_medicine_order(order_id, user_id);
            let blob = to_candid(response);
            let cancelResponseKeys = ["success", "message", "cancelled_id"];
            let #ok(jsonText) = JSON.toText(blob, cancelResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
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

      case ("POST", "/delete-wellness-log") {
        let deleteRequest = extractDeleteWellnessRequest(body);
        switch (deleteRequest) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok({user_id; date})) {
            let response = await delete_wellness_log(user_id, date);
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
      case ("POST", "/store-user-profile") {
        let profileResult = extractUserProfile(body);
        switch (profileResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(profile)) {
            let response = await store_user_profile(profile);
            let blob = to_candid(response);
            let #ok(jsonText) = JSON.toText(blob, UserProfileResponseKeys, null) else return makeSerializationErrorResponse();
            makeJsonResponse(200, jsonText);
          };
        };
      };
      case ("POST", "/get-user-profile") {
        let userIdResult = extractUserId(body);
        switch (userIdResult) {
          case (#err(errorMessage)) {
            return makeJsonResponse(400, "{\"error\": \"" # errorMessage # "\"}");
          };
          case (#ok(user_id)) {
            let response = await get_user_profile(user_id);
            let blob = to_candid(response);
            let #ok(jsonText) = JSON.toText(blob, UserProfileResponseKeys, null) else return makeSerializationErrorResponse();
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