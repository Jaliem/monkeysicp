import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";

module {
  // ----- HTTP types -----
  public type HeaderField = (Text, Text);

  public type HttpRequest = {
    method : Text;
    url : Text;
    headers : [HeaderField];
    body : Blob;
    certificate_version : ?Nat16;
  };

  public type HttpResponse = {
    status_code : Nat16;
    headers : [HeaderField];
    body : Blob;
    streaming_strategy : ?Null;
    upgrade : ?Bool;
  };

  // ----- Basic API response types -----
  public type WelcomeResponse = {
    message : Text;
  };

  // ----- Healthcare API types -----
  public type SymptomData = {
    symptoms : Text;
    timestamp : Text;
    user_id : Text;
  };

  public type MedicationReminder = {
    medicine : Text;
    time : Text;
    created_at : Text;
    user_id : Text;
    active : Bool;
  };

  public type EmergencyAlert = {
    timestamp : Text;
    user_id : Text;
    status : Text;
  };

  public type HealthStorageResponse = {
    success : Bool;
    message : Text;
    id : ?Text;
  };

  public type SymptomHistoryResponse = {
    symptoms : [SymptomData];
    total_count : Nat;
  };

  public type ReminderListResponse = {
    reminders : [MedicationReminder];
    active_count : Nat;
  };

  public type EmergencyStatusResponse = {
    has_active_emergency : Bool;
    latest_emergency : ?EmergencyAlert;
  };

  // ----- Doctor & Appointment API types -----
  public type Doctor = {
    doctor_id : Text;
    name : Text;
    specialty : Text;
    qualifications : Text;
    experience_years : Nat;
    rating : Float;
    available_days : [Text];
    available_slots : [Text];
  };

  public type Appointment = {
    appointment_id : Text;
    doctor_id : Text;
    doctor_name : Text;
    specialty : Text;
    patient_symptoms : ?Text;
    appointment_date : Text;
    appointment_time : Text;
    status : Text; // "confirmed", "cancelled", "rescheduled", "completed"
    urgency : Text;
    created_at : Text;
    user_id : Text;
  };

  public type DoctorSearchResponse = {
    doctors : [Doctor];
    total_count : Nat;
  };

  public type AppointmentResponse = {
    success : Bool;
    appointment_id : ?Text;
    message : Text;
    appointment : ?Appointment;
  };

  public type DoctorAvailabilityResponse = {
    doctor : Doctor;
    available_slots : [Text];
    next_available : ?Text;
  };

  // Represents a single day's wellness log for a user.
  public type WellnessLog = {
    user_id: Text;
    date: Text; // Stored in "YYYY-MM-DD" format
    sleep: ?Float;
    steps: ?Nat;
    exercise: ?Text;
    mood: ?Text;
    water_intake: ?Float;
  };

  // The response after successfully storing a log.
  public type StoreResponse = {
    success: Bool;
    message: Text;
    id: ?Text;
    logged_data: ?WellnessLog;
  };

  // The response when the agent requests a summary.
  public type SummaryResponse = {
    logs: [WellnessLog];
    total_count: Nat;
    success: Bool;
    message: Text;
  };
  
  public type StreamingCallbackToken = {
    key: Text;
    index: Nat;
  };

  public type StreamingStrategy = {
    #Callback: {
      token: StreamingCallbackToken;
      callback: shared query (StreamingCallbackToken) -> async StreamingCallbackHttpResponse;
    };
  };

  public type StreamingCallbackHttpResponse = {
    body: Blob;
    token: ?StreamingCallbackToken;
  };

  // ----- Medicine & Pharmacy API types -----
  public type Medicine = {
    medicine_id : Text;
    name : Text;
    generic_name : ?Text;
    category : Text; // e.g., "Pain Relief", "Antibiotic", "Vitamin"
    stock : Nat;
    price : Float;
    manufacturer : ?Text;
    description : ?Text;
    requires_prescription : Bool;
    active_ingredient : ?Text;
    dosage : ?Text;
  };

  public type MedicineOrder = {
    order_id : Text;
    medicine_id : Text;
    medicine_name : Text;
    quantity : Nat;
    unit_price : Float;
    total_price : Float;
    user_id : Text;
    order_date : Text;
    status : Text; // "pending", "confirmed", "dispensed", "cancelled"
    prescription_id : ?Text;
    pharmacy_notes : ?Text;
  };

  public type MedicineSearchResponse = {
    medicines : [Medicine];
    total_count : Nat;
    status : Text;
  };

  public type MedicineOrderResponse = {
    success : Bool;
    order_id : ?Text;
    message : Text;
    order : ?MedicineOrder;
    suggested_alternatives : ?[Medicine];
  };

  public type PharmacyInventoryResponse = {
    medicine : Medicine;
    available : Bool;
    stock_level : Nat;
    estimated_restock : ?Text;
  };
};
