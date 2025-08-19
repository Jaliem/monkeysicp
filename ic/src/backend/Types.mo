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
};
