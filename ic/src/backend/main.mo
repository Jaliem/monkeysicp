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
import { JSON } "mo:serde";
import Types "./Types";

actor {
  // Record keys for JSON serialization - Healthcare
  let WelcomeResponseKeys = ["message"];  
  let SymptomDataKeys = ["symptoms", "timestamp", "user_id"];
  let MedicationReminderKeys = ["medicine", "time", "created_at", "user_id", "active"];
  let EmergencyAlertKeys = ["timestamp", "user_id", "status"];
  let HealthStorageResponseKeys = ["success", "message", "id"];
  let SymptomHistoryResponseKeys = ["symptoms", "total_count"];
  let ReminderListResponseKeys = ["reminders", "active_count"];
  let EmergencyStatusResponseKeys = ["has_active_emergency", "latest_emergency"];
  
  // Doctor & Appointment JSON keys
  let DoctorKeys = ["doctor_id", "name", "specialty", "qualifications", "experience_years", "rating", "available_days", "available_slots"];
  let AppointmentKeys = ["appointment_id", "doctor_id", "doctor_name", "specialty", "patient_symptoms", "appointment_date", "appointment_time", "status", "urgency", "created_at", "user_id"];
  let DoctorSearchResponseKeys = ["doctors", "total_count"];
  let AppointmentResponseKeys = ["success", "appointment_id", "message", "appointment"];
  let DoctorAvailabilityResponseKeys = ["doctor", "available_slots", "next_available"];

  // Healthcare data storage
  private stable var symptom_entries : [(Text, Types.SymptomData)] = [];
  private stable var medication_reminders : [(Text, Types.MedicationReminder)] = [];  
  private stable var emergency_alerts : [(Text, Types.EmergencyAlert)] = [];
  private stable var doctor_entries : [(Text, Types.Doctor)] = [];
  private stable var appointment_entries : [(Text, Types.Appointment)] = [];
  private stable var next_id : Nat = 1;

  private var symptoms = Buffer.Buffer<(Text, Types.SymptomData)>(0);
  private var reminders = Buffer.Buffer<(Text, Types.MedicationReminder)>(0);
  private var emergencies = Buffer.Buffer<(Text, Types.EmergencyAlert)>(0);
  private var doctors = Buffer.Buffer<(Text, Types.Doctor)>(0);
  private var appointments = Buffer.Buffer<(Text, Types.Appointment)>(0);

  system func preupgrade() {
    symptom_entries := Buffer.toArray(symptoms);
    medication_reminders := Buffer.toArray(reminders);
    emergency_alerts := Buffer.toArray(emergencies);
    doctor_entries := Buffer.toArray(doctors);
    appointment_entries := Buffer.toArray(appointments);
  };

  system func postupgrade() {
    symptoms := Buffer.fromArray(symptom_entries);
    reminders := Buffer.fromArray(medication_reminders);  
    emergencies := Buffer.fromArray(emergency_alerts);
    doctors := Buffer.fromArray(doctor_entries);
    appointments := Buffer.fromArray(appointment_entries);
    symptom_entries := [];
    medication_reminders := [];
    emergency_alerts := [];
    doctor_entries := [];
    appointment_entries := [];
    
    // Initialize doctors if empty
    if (doctors.size() == 0) {
      initializeDoctors();
    };
  };

  // ----- Doctor Database Initialization -----
  
  private func initializeDoctors() {
    Debug.print("[INIT]: Initializing doctor database");
    
    // Cardiology doctors
    let card1 : Types.Doctor = {
      doctor_id = "card_001";
      name = "Dr. Amir Hassan";
      specialty = "Cardiology";
      qualifications = "MD, FACC";
      experience_years = 15;
      rating = 4.8;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["09:00", "11:00", "14:00", "16:00"];
    };
    let card2 : Types.Doctor = {
      doctor_id = "card_002";
      name = "Dr. Sarah Chen";
      specialty = "Cardiology";
      qualifications = "MD, FACC, FHRS";
      experience_years = 12;
      rating = 4.7;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["10:00", "13:00", "15:00"];
    };
    doctors.add(("card_001", card1));
    doctors.add(("card_002", card2));
    
    // Dermatology doctors
    let derm1 : Types.Doctor = {
      doctor_id = "derm_001";
      name = "Dr. Bella Rodriguez";
      specialty = "Dermatology";
      qualifications = "MD, FAAD";
      experience_years = 10;
      rating = 4.6;
      available_days = ["Monday", "Tuesday", "Thursday"];
      available_slots = ["08:00", "10:00", "14:00", "16:00"];
    };
    doctors.add(("derm_001", derm1));
    
    // Neurology doctors
    let neuro1 : Types.Doctor = {
      doctor_id = "neuro_001";
      name = "Dr. Chen Wang";
      specialty = "Neurology";
      qualifications = "MD, FAAN";
      experience_years = 18;
      rating = 4.9;
      available_days = ["Wednesday", "Friday"];
      available_slots = ["09:00", "13:00", "15:00", "17:00"];
    };
    doctors.add(("neuro_001", neuro1));
    
    // Orthopedics doctors
    let ortho1 : Types.Doctor = {
      doctor_id = "ortho_001";
      name = "Dr. Miguel Diaz";
      specialty = "Orthopedics";
      qualifications = "MD, FAAOS";
      experience_years = 14;
      rating = 4.5;
      available_days = ["Monday", "Wednesday"];
      available_slots = ["09:30", "16:00", "18:00"];
    };
    doctors.add(("ortho_001", ortho1));
    
    // Pediatrics doctors
    let pedia1 : Types.Doctor = {
      doctor_id = "pedia_001";
      name = "Dr. Emily Johnson";
      specialty = "Pediatrics";
      qualifications = "MD, FAAP";
      experience_years = 8;
      rating = 4.8;
      available_days = ["Tuesday", "Thursday", "Saturday"];
      available_slots = ["08:00", "12:00", "14:00"];
    };
    doctors.add(("pedia_001", pedia1));
    
    // Oncology doctors
    let onco1 : Types.Doctor = {
      doctor_id = "onco_001";
      name = "Dr. Faisal Ahmad";
      specialty = "Oncology";
      qualifications = "MD, FACP";
      experience_years = 20;
      rating = 4.7;
      available_days = ["Monday", "Wednesday", "Friday"];
      available_slots = ["10:30", "13:30", "15:30"];
    };
    doctors.add(("onco_001", onco1));
    
    // Psychiatry doctors
    let psych1 : Types.Doctor = {
      doctor_id = "psych_001";
      name = "Dr. Grace Liu";
      specialty = "Psychiatry";
      qualifications = "MD, FAPA";
      experience_years = 11;
      rating = 4.6;
      available_days = ["Tuesday", "Thursday"];
      available_slots = ["09:15", "11:15", "13:15"];
    };
    doctors.add(("psych_001", psych1));
    
    // General Practitioner doctors
    let gp1 : Types.Doctor = {
      doctor_id = "gp_001";
      name = "Dr. Hiro Tanaka";
      specialty = "General Practitioner";
      qualifications = "MD, AAFP";
      experience_years = 7;
      rating = 4.4;
      available_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      available_slots = ["08:30", "10:30", "12:30", "14:30"];
    };
    doctors.add(("gp_001", gp1));
    
    Debug.print("[INIT]: Added " # Nat.toText(doctors.size()) # " doctors to database");
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

  // ----- Private helper functions -----

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
      case ("POST", "/store-symptoms" or "/store-reminder" or "/emergency-alert" or "/get-symptom-history" or "/get-reminders" or "/get-emergency-status" or "/store-doctor" or "/get-doctors-by-specialty" or "/store-appointment" or "/get-user-appointments" or "/update-appointment") {
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
