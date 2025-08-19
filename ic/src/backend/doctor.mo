import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";

actor DoctorBackend {
    
    public type Doctor = {
        name: Text;
        specialty: Text;
        slots: [Text];
    };

    // Disease to specialty mapping
    private let diseaseToSpecialty = HashMap.HashMap<Text, Text>(10, Text.equal, Text.hash);
    
    // Doctors data
    private let doctors = HashMap.HashMap<Text, [Doctor]>(10, Text.equal, Text.hash);

    // Initialize data
    private func initData() {
        // Disease mappings
        diseaseToSpecialty.put("heart disease", "Cardiologist");
        diseaseToSpecialty.put("skin problem", "Dermatologist");
        diseaseToSpecialty.put("headache", "Neurologist");
        diseaseToSpecialty.put("bone fracture", "Orthopedic");
        diseaseToSpecialty.put("child fever", "Pediatrician");
        diseaseToSpecialty.put("cancer", "Oncologist");
        diseaseToSpecialty.put("depression", "Psychiatrist");
        diseaseToSpecialty.put("common cold", "General Practitioner");

        // Doctors by specialty
        doctors.put("Cardiologist", [
            {name = "Dr. Amir"; specialty = "Cardiologist"; slots = ["09:00", "11:00", "13:00"]},
            {name = "Dr. Sarah"; specialty = "Cardiologist"; slots = ["10:00", "14:00", "16:00"]}
        ]);

        doctors.put("Dermatologist", [
            {name = "Dr. Bella"; specialty = "Dermatologist"; slots = ["10:00", "14:00", "16:00"]}
        ]);

        doctors.put("Neurologist", [
            {name = "Dr. Chen"; specialty = "Neurologist"; slots = ["13:00", "15:00", "17:00"]}
        ]);

        doctors.put("Orthopedic", [
            {name = "Dr. Diaz"; specialty = "Orthopedic"; slots = ["09:30", "16:00", "18:00"]}
        ]);

        doctors.put("Pediatrician", [
            {name = "Dr. Emily"; specialty = "Pediatrician"; slots = ["08:00", "12:00", "14:00"]}
        ]);

        doctors.put("Oncologist", [
            {name = "Dr. Faisal"; specialty = "Oncologist"; slots = ["10:30", "13:30", "15:30"]}
        ]);

        doctors.put("Psychiatrist", [
            {name = "Dr. Grace"; specialty = "Psychiatrist"; slots = ["09:15", "11:15", "13:15"]}
        ]);

        doctors.put("General Practitioner", [
            {name = "Dr. Hiro"; specialty = "General Practitioner"; slots = ["08:30", "10:30", "12:30"]}
        ]);
    };

    // Initialize on deployment
    initData();

    // Main function: Get doctors by disease
    public query func getDoctorsByDisease(disease: Text) : async [Doctor] {
        let lowercaseDisease = Text.map(disease, func(c: Char) : Char {
            if (c >= 'A' and c <= 'Z') {
                Char.fromNat32(Char.toNat32(c) + 32)
            } else { c }
        });

        switch (diseaseToSpecialty.get(lowercaseDisease)) {
            case (?specialty) {
                switch (doctors.get(specialty)) {
                    case (?doctorList) { doctorList };
                    case null { [] };
                }
            };
            case null { [] };
        }
    };
}