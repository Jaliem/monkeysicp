import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Plus, X, Edit, Trash2, Users, Pill } from "lucide-react";
import NavbarAdmin from "./navAdmin";
import { 
  storeDoctor, 
  storeMedicine,
  fetchDoctors,
  fetchMedicines,
  updateDoctor,
  deleteDoctor,
  updateMedicine,
  deleteMedicine
} from "./services/flaskService";

interface Doctor {
  doctor_id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experience_years: number;
  rating: number;
  available_days: string[];
  available_slots: string[];
  image_url: string;
  // Frontend-only fields for display
  id?: string;
  reviews?: number;
  experience?: number;
  location?: string;
  availability?: string[];
  price?: number;
  image?: string;
  bio?: string;
  languages?: string[];
}

interface Medicine {
  medicine_id: string;
  name: string;
  generic_name?: string;
  category: string;
  stock: number;
  price: number;
  manufacturer?: string;
  description?: string;
  requires_prescription: boolean;
  active_ingredient?: string;
  dosage?: string;
  image_url?: string;
  image?: string;
}

const Admin = () => {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [validationState, setValidationState] = useState({
    doctor: false,
    medicine: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [doctorData, setDoctorData] = useState<Doctor>({
    doctor_id: "",
    name: "",
    specialty: "",
    qualifications: "",
    experience_years: 0,
    rating: 4.5,
    available_days: [],
    available_slots: [],
    image_url: "",
    // Display-only fields
    reviews: 0,
    experience: 0,
    location: "",
    availability: [],
    price: 0,
    image: "",
    bio: "",
    languages: [],
  });

  const [medicineData, setMedicineData] = useState<Medicine>({
    medicine_id: "",
    name: "",
    generic_name: "",
    category: "",
    stock: 0,
    price: 0,
    manufacturer: "",
    description: "",
    requires_prescription: false,
    active_ingredient: "",
    dosage: "",
  });

  const [medicineImagePreview, setMedicineImagePreview] = useState<
    string | null
  >(null);
  const [uploadingMedicineImage, setUploadingMedicineImage] = useState(false);

  // Data management states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activeSection, setActiveSection] = useState<"doctors" | "medicines">("doctors");
  const [doctorMode, setDoctorMode] = useState<"add" | "manage">("add");
  const [medicineMode, setMedicineMode] = useState<"add" | "manage">("add");
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Edit states
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'doctor' | 'medicine';
    id: string;
    name: string;
  } | null>(null);

  const specialties = [
    "Cardiology",
    "Dermatology",
    "General Practice",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
  ];

  const medicineCategories = [
    "Pain Relief",
    "Antibiotic",
    "Vitamin",
    "Diabetes",
    "Cardiovascular",
    "Respiratory",
    "Digestive",
    "Neurological",
    "Dermatological",
  ];

  const availableDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  const languages = [
    "Indonesian",
    "English",
    "Mandarin",
    "Arabic",
    "Spanish",
    "French",
    "German",
    "Japanese",
  ];

  useEffect(() => {
    initAuth();
    loadData();
  }, []);

  // Load data for management sections
  const loadData = async () => {
    setLoadingData(true);
    setDataError(null);
    
    try {
      console.log('Loading admin data...');
      
      // Load doctors from all specialties
      console.log('Loading doctors from specialties:', specialties);
      const specialtyPromises = specialties.map(async (specialty) => {
        console.log(`Fetching doctors for ${specialty}...`);
        return await fetchDoctors(specialty);
      });
      
      const doctorResults = await Promise.all(specialtyPromises);
      const allDoctors = doctorResults.flat();
      console.log('All doctors raw data loaded:', allDoctors.length, 'doctors');
      console.log('First doctor raw sample:', allDoctors[0]);
      
      // Parse ICP doctor data format using numeric keys
      const parsedDoctors = allDoctors.map((doctor: any) => ({
        // Backend fields (required)
        doctor_id: doctor["3_732_697_147"] || doctor.doctor_id || `doc_${Date.now()}_${Math.random()}`,
        name: doctor["1_224_700_491"] || doctor.name || 'Unknown Doctor',
        specialty: (doctor["2_069_078_014"] || doctor.specialty || 'General Practice'),
        qualifications: doctor["1_692_858_852"] || doctor.qualifications || '',
        experience_years: doctor["825_774_209"] || doctor.experience_years || 5,
        rating: doctor["3_146_396_701"] || doctor.rating || 4.5,
        available_days: doctor["2_213_151_757"] || doctor.available_days || [],
        available_slots: doctor["2_467_954_303"] || doctor.available_slots || [],
        image_url: doctor["914_348_363"] || doctor.image_url || '',
        // Display fields
        id: doctor["3_732_697_147"] || doctor.doctor_id,
        reviews: Math.floor(Math.random() * 200) + 50,
        experience: doctor["825_774_209"] || doctor.experience_years || 5,
        location: 'Medical Center',
        availability: doctor["2_213_151_757"] || doctor.available_days || [],
        price: Math.floor(Math.random() * 100) + 100,
        image: doctor["914_348_363"] || doctor.image_url || '',
        bio: `Experienced ${doctor["2_069_078_014"] || doctor.specialty || 'general practice'} specialist with ${doctor["825_774_209"] || doctor.experience_years || 5}+ years of experience. ${doctor["1_692_858_852"] || doctor.qualifications || ''}.`,
        languages: ['English']
      }));
      
      // Remove duplicates using parsed data
      const uniqueDoctors = parsedDoctors.filter((doctor, index, self) => 
        index === self.findIndex(d => d.doctor_id === doctor.doctor_id)
      );
      console.log('👨‍⚕️ Parsed doctors:', uniqueDoctors.length);
      console.log('First parsed doctor sample:', uniqueDoctors[0]);
      setDoctors(uniqueDoctors);

      // Load medicines
      console.log('💊 Loading medicines...');
      const medicinesData = await fetchMedicines();
      console.log('📋 Medicines raw data loaded:', medicinesData.length, 'medicines');
      console.log('First medicine raw sample:', medicinesData[0]);
      
      // Parse ICP medicine data format using numeric keys
      const parsedMedicines = medicinesData.map((medicine: any) => ({
        medicine_id: medicine["1_098_344_064"] || medicine.medicine_id || `med_${Date.now()}_${Math.random()}`,
        name: medicine["1_224_700_491"] || medicine.name || 'Unknown Medicine',
        generic_name: medicine["1_026_369_715"] || medicine.generic_name || medicine["1_224_700_491"] || medicine.name || 'N/A',
        category: (medicine["2_909_547_262"] || medicine.category || 'general'),
        dosage: medicine["829_945_655"] || medicine.dosage || 'N/A',
        price: medicine["3_364_572_809"] || medicine.price || 0,
        stock: medicine["2_216_036_054"] || medicine.stock || 0,
        manufacturer: medicine["341_121_617"] || medicine.manufacturer || 'Unknown',
        requires_prescription: medicine["3_699_773_643"] || medicine.requires_prescription || false,
        description: medicine["1_595_738_364"] || medicine.description || 'Medicine description not available.',
        active_ingredient: medicine["819_652_970"] || medicine.active_ingredient || 'N/A',
        image_url: medicine["914_348_363"] || medicine.image_url || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop&crop=center',
        image: medicine["914_348_363"] || medicine.image_url || medicine.image || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop&crop=center'
      }));
      
      console.log('Parsed medicines:', parsedMedicines.length);
      console.log('First parsed medicine sample:', parsedMedicines[0]);
      setMedicines(parsedMedicines);
      
      console.log('Data loading and parsing completed');
    } catch (error) {
      console.error("Error loading data:", error);
      setDataError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const client = await AuthClient.create();
      const isAuthenticated = await client.isAuthenticated();

      if (isAuthenticated) {
        const identity = client.getIdentity();
        const principalId = identity.getPrincipal().toString();
        setPrincipal(principalId);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateDoctorData = (data: Doctor) => {
    return (
      [
        data.name,
        data.specialty,
        data.qualifications,
      ].every((field) => field && field.trim() !== "") &&
      data.experience_years > 0 &&
      data.available_days &&
      data.available_days.length > 0 &&
      data.available_slots &&
      data.available_slots.length > 0
    );
  };

  const validateMedicineData = (data: Medicine) => {
    return (
      [data.name, data.category].every(
        (field) => field && field.trim() !== ""
      ) &&
      data.stock >= 0 &&
      data.price > 0
    );
  };

  const updateValidation = () => {
    setValidationState({
      doctor: validateDoctorData(doctorData) || false,
      medicine: validateMedicineData(medicineData) || false,
    });
  };

  useEffect(() => {
    updateValidation();
  }, [doctorData, medicineData]);

  const handleDoctorChange = (field: keyof Doctor, value: any) => {
    setDoctorData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMedicineChange = (field: keyof Medicine, value: any) => {
    setMedicineData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayToggle = (
    array: string[],
    item: string,
    setter: (value: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveStatus({
        type: "error",
        message: "Please select a valid image file",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus({
        type: "error",
        message: "Image size must be less than 5MB",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        handleDoctorChange("image_url", result);
        handleDoctorChange("image", result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setSaveStatus({ type: "error", message: "Failed to upload image" });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    handleDoctorChange("image_url", "");
    handleDoctorChange("image", "");
  };

  const handleMedicineImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveStatus({
        type: "error",
        message: "Please select a valid image file",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus({
        type: "error",
        message: "Image size must be less than 5MB",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
      return;
    }

    setUploadingMedicineImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setMedicineImagePreview(result);
        handleMedicineChange("image_url", result);
        handleMedicineChange("image", result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setSaveStatus({ type: "error", message: "Failed to upload image" });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    } finally {
      setUploadingMedicineImage(false);
    }
  };

  const removeMedicineImage = () => {
    setMedicineImagePreview(null);
    handleMedicineChange("image_url", "");
    handleMedicineChange("image", "");
  };

  const handleSave = async () => {
    if (!principal) {
      setSaveStatus({ type: "error", message: "User not authenticated" });
      return;
    }

    const isValid = 
      activeSection === "doctors" && doctorMode === "add"
        ? validationState.doctor
        : activeSection === "medicines" && medicineMode === "add"
        ? validationState.medicine
        : false;
    if (!isValid) {
      setSaveStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: "" });

    try {
      // Generate ID if not provided and prepare data for backend
      let dataToSend;
      let result;
      let isEditing = false;
      
      if (activeSection === "doctors" && doctorMode === "add") {
        isEditing = !!editingDoctor;
        
        // Use existing ID if editing, generate new one if adding
        const doctor_id = editingDoctor?.doctor_id || doctorData.doctor_id || `doctor_${Date.now()}`;
        
        // Prepare data matching backend Types.Doctor exactly
        dataToSend = {
          doctor_id,
          name: doctorData.name,
          specialty: doctorData.specialty,
          qualifications: doctorData.qualifications,
          experience_years: doctorData.experience_years,
          rating: doctorData.rating,
          available_days: doctorData.available_days,
          available_slots: doctorData.available_slots,
          image_url: doctorData.image_url || doctorData.image || ""
        };
        
        console.log(`Admin ${isEditing ? 'updating' : 'adding'} doctor data:`, dataToSend);
        
        if (isEditing) {
          result = await updateDoctor(doctor_id, dataToSend);
        } else {
          result = await storeDoctor(dataToSend);
        }
        
      } else if (activeSection === "medicines" && medicineMode === "add") {
        isEditing = !!editingMedicine;
        
        // Use existing ID if editing, generate new one if adding
        const medicine_id = editingMedicine?.medicine_id || medicineData.medicine_id || `medicine_${Date.now()}`;
        
        // Prepare data matching backend Types.Medicine exactly
        dataToSend = {
          medicine_id,
          name: medicineData.name,
          generic_name: medicineData.generic_name || null,
          category: medicineData.category,
          stock: medicineData.stock,
          price: medicineData.price,
          manufacturer: medicineData.manufacturer || null,
          description: medicineData.description || null,
          requires_prescription: medicineData.requires_prescription,
          active_ingredient: medicineData.active_ingredient || null,
          dosage: medicineData.dosage || null,
          image_url: medicineData.image_url || medicineData.image || ""
        };
        
        console.log(`Admin ${isEditing ? 'updating' : 'adding'} medicine data:`, dataToSend);
        
        if (isEditing) {
          result = await updateMedicine(medicine_id, dataToSend);
        } else {
          result = await storeMedicine(dataToSend);
        }
      }

      if (result && result.success !== false) {
        setSaveStatus({
          type: "success",
          message: `${
            activeSection === "doctors" ? "Doctor" : "Medicine"
          } ${isEditing ? 'updated' : 'added'} successfully!`,
        });
        
        // Reload data after successful save
        await loadData();
        
        // Clear editing state
        setEditingDoctor(null);
        setEditingMedicine(null);
        
        // Reset form after successful save
        if (activeSection === "doctors") {
          setDoctorData({
            doctor_id: "",
            name: "",
            specialty: "",
            qualifications: "",
            experience_years: 0,
            rating: 4.5,
            available_days: [],
            available_slots: [],
            image_url: "",
            // Display-only fields
            reviews: 0,
            experience: 0,
            location: "",
            availability: [],
            price: 0,
            image: "",
            bio: "",
            languages: [],
          });
          setImagePreview(null);
        } else {
          setMedicineData({
            medicine_id: "",
            name: "",
            generic_name: "",
            category: "",
            stock: 0,
            price: 0,
            manufacturer: "",
            description: "",
            requires_prescription: false,
            active_ingredient: "",
            dosage: "",
            image_url: "",
          });
          setMedicineImagePreview(null);
        }
      } else {
        setSaveStatus({
          type: "error",
          message: result?.message || "Failed to save data",
        });
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save data",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    }
  };

  // Edit functions
  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorData({
      ...doctor,
      // Ensure all fields are present for editing
      experience: doctor.experience_years,
      availability: doctor.available_days,
      languages: doctor.languages || ['English']
    });
    setDoctorMode("add"); // Reuse add form for editing
    setActiveSection("doctors");
    setImagePreview(doctor.image_url || doctor.image || null);
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setMedicineData({...medicine});
    setMedicineMode("add"); // Reuse add form for editing
    setActiveSection("medicines");
    setMedicineImagePreview(medicine.image_url || medicine.image || null);
  };

  const handleDeleteConfirm = (type: 'doctor' | 'medicine', id: string, name: string) => {
    setShowDeleteConfirm({ type, id, name });
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    setIsSaving(true);
    try {
      console.log('Deleting doctor:', doctorId);
      const result = await deleteDoctor(doctorId);
      
      if (result && result.success !== false) {
        setSaveStatus({
          type: "success",
          message: "Doctor deleted successfully!"
        });
        await loadData(); // Reload data
      } else {
        setSaveStatus({
          type: "error",
          message: result?.message || "Failed to delete doctor"
        });
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setSaveStatus({
        type: "error",
        message: "Error deleting doctor"
      });
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(null);
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    setIsSaving(true);
    try {
      console.log('Deleting medicine:', medicineId);
      const result = await deleteMedicine(medicineId);
      
      if (result && result.success !== false) {
        setSaveStatus({
          type: "success",
          message: "Medicine deleted successfully!"
        });
        await loadData(); // Reload data
      } else {
        setSaveStatus({
          type: "error",
          message: result?.message || "Failed to delete medicine"
        });
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      setSaveStatus({
        type: "error",
        message: "Error deleting medicine"
      });
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(null);
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingDoctor(null);
    setEditingMedicine(null);
    // Reset forms
    setDoctorData({
      doctor_id: "",
      name: "",
      specialty: "",
      qualifications: "",
      experience_years: 0,
      rating: 4.5,
      available_days: [],
      available_slots: [],
      image_url: "",
      reviews: 0,
      experience: 0,
      location: "",
      availability: [],
      price: 0,
      image: "",
      bio: "",
      languages: [],
    });
    setMedicineData({
      medicine_id: "",
      name: "",
      generic_name: "",
      category: "",
      stock: 0,
      price: 0,
      manufacturer: "",
      description: "",
      requires_prescription: false,
      active_ingredient: "",
      dosage: "",
      image_url: "",
    });
    setImagePreview(null);
    setMedicineImagePreview(null);
  };


  if (isLoading) {
    return (
      <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-stone-600 font-light">Loading page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <NavbarAdmin />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
                  Add Records
                </h1>
                {/* Development: Admin Access Test */}
             
                {saveStatus.type && (
                  <div
                    className={`mt-2 px-3 py-1 rounded-lg text-sm font-light ${
                      saveStatus.type === "success"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {saveStatus.message}
                  </div>
                )}
              </div>
              {principal && (
                <div className="text-right">
                  <p className="text-sm text-stone-500 font-light">
                    Principal ID
                  </p>
                  <p className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-1 rounded">
                    {principal.substring(0, 8)}...
                    {principal.substring(principal.length - 8)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveSection("doctors")}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeSection === "doctors"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              <Users className="w-5 h-5" />
              Doctors
            </button>
            <button
              onClick={() => setActiveSection("medicines")}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeSection === "medicines"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              <Pill className="w-5 h-5" />
              Medicines
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            {/* Doctors Section */}
            {activeSection === "doctors" && (
              <div className="p-8">
                {/* Sub-navigation for Doctor actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setDoctorMode("add")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      doctorMode === "add"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Add Doctor
                  </button>
                  <button
                    onClick={() => setDoctorMode("manage")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      doctorMode === "manage"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Manage Doctors ({doctors.length})
                  </button>
                </div>

                {doctorMode === "add" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-light text-stone-800 font-serif">
                        {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                      </h2>
                      {editingDoctor && (
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                <div className="space-y-8 justify-center">
                  {/* Profile Image Upload */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Profile Photo
                    </h3>
                    <div className="flex items-start space-x-6 justify-center">
                      {/* Circular Image Upload */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-stone-200">
                            {imagePreview || doctorData.image_url ? (
                              <img
                                src={imagePreview || doctorData.image_url}
                                alt="Doctor preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <label className="w-full h-full bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={uploadingImage}
                                  className="hidden"
                                />
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-1 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                    <Plus className="w-6 h-6 text-emerald-600" />
                                  </div>
                                </div>
                              </label>
                            )}
                          </div>

                          {/* Remove button when image exists */}
                          {(imagePreview || doctorData.image_url) && (
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Upload overlay when image exists */}
                          {(imagePreview || doctorData.image_url) && (
                            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="hidden"
                              />
                              <div className="text-center">
                                <Plus className="w-6 h-6 text-white mx-auto mb-1" />
                                <p className="text-xs text-white font-light">
                                  Change
                                </p>
                              </div>
                            </label>
                          )}

                          {/* Loading overlay */}
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={doctorData.name}
                          onChange={(e) =>
                            handleDoctorChange("name", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Dr. John Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Specialty *
                        </label>
                        <select
                          value={doctorData.specialty}
                          onChange={(e) =>
                            handleDoctorChange("specialty", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light appearance-none"
style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                        >
                          <option value="">Select specialty</option>
                          {specialties.map((specialty) => (
                            <option key={specialty} value={specialty}>
                              {specialty}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Experience (years) *
                        </label>
                        <input
                          type="number"
                          value={doctorData.experience_years || ""}
                          onChange={(e) =>
                            handleDoctorChange(
                              "experience_years",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="5"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Consultation Fee (IDR) *
                        </label>
                        <input
                          type="number"
                          value={doctorData.price || ""}
                          onChange={(e) =>
                            handleDoctorChange(
                              "price",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="500000"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-stone-700 font-light mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={doctorData.location}
                          onChange={(e) =>
                            handleDoctorChange("location", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Jakarta Medical Center"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-stone-700 font-light mb-2">
                          Qualifications *
                        </label>
                        <input
                          type="text"
                          value={doctorData.qualifications}
                          onChange={(e) =>
                            handleDoctorChange("qualifications", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="MD, FACC"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-stone-700 font-light mb-2">
                          Bio *
                        </label>
                        <textarea
                          value={doctorData.bio}
                          onChange={(e) =>
                            handleDoctorChange("bio", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Brief description of the doctor's background and expertise..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Languages Spoken *
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {languages.map((language) => (
                        <label
                          key={language}
                          className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={doctorData.languages?.includes(language) || false}
                            onChange={() =>
                              handleArrayToggle(
                                doctorData.languages || [],
                                language,
                                (value) =>
                                  handleDoctorChange("languages", value)
                              )
                            }
                            className="mr-3 w-4 h-4 text-emerald-600"
                          />
                          <span className="font-light text-stone-700">
                            {language}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Available Days */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Available Days *
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableDays.map((day) => (
                        <label
                          key={day}
                          className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={doctorData.available_days?.includes(day)}
                            onChange={() =>
                              handleArrayToggle(
                                doctorData.available_days || [],
                                day,
                                (value) =>
                                  handleDoctorChange("available_days", value)
                              )
                            }
                            className="mr-3 w-4 h-4 text-emerald-600"
                          />
                          <span className="font-light text-stone-700">
                            {day}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Available Time Slots *
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {timeSlots.map((slot) => (
                        <label
                          key={slot}
                          className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={doctorData.available_slots?.includes(slot)}
                            onChange={() =>
                              handleArrayToggle(
                                doctorData.available_slots || [],
                                slot,
                                (value) =>
                                  handleDoctorChange("available_slots", value)
                              )
                            }
                            className="mr-3 w-4 h-4 text-emerald-600"
                          />
                          <span className="font-light text-stone-700">
                            {slot}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                  </div>
                )}

                {doctorMode === "manage" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-light text-stone-800 font-serif">
                        Manage Doctors
                      </h2>
                      <button 
                        onClick={loadData}
                        disabled={loadingData}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        {loadingData ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    {dataError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">Error loading doctors: {dataError}</p>
                        <button 
                          onClick={loadData}
                          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {loadingData ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-stone-600 font-light">Loading doctors...</p>
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500 font-light text-lg">No doctors found</p>
                        <p className="text-stone-400 font-light">Add your first doctor to get started</p>
                        <button 
                          onClick={() => setDoctorMode("add")}
                          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                        >
                          Add Doctor
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Desktop Table Header - Hidden on mobile */}
                        <div className="hidden lg:block bg-stone-50 border border-stone-200 rounded-lg p-4 font-medium text-stone-700 text-sm">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">Photo</div>
                            <div className="col-span-2">Name</div>
                            <div className="col-span-2">Specialty</div>
                            <div className="col-span-2">Location</div>
                            <div className="col-span-1">Experience</div>
                            <div className="col-span-1">Price</div>
                            <div className="col-span-1">Rating</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                        </div>

                        {/* Data rows - Responsive */}
                        {doctors.map((doctor, index) => (
                          <div key={doctor.id || doctor.doctor_id || `doctor-${index}`} className="bg-white border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                            {/* Desktop Layout */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100">
                                  {doctor.image_url || doctor.image ? (
                                    <img 
                                      src={doctor.image_url || doctor.image} 
                                      alt={doctor.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                      <Users className="w-4 h-4 text-emerald-600" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <p className="font-medium text-stone-800">{doctor.name}</p>
                                <p className="text-xs text-stone-500">{doctor.qualifications}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-stone-700">{doctor.specialty}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-stone-600 text-sm">{doctor.location}</p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-stone-600 text-sm">{doctor.experience_years || doctor.experience} yrs</p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-stone-600 text-sm">IDR {doctor.price?.toLocaleString()}</p>
                              </div>
                              <div className="col-span-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500 text-xs">★</span>
                                  <span className="text-stone-600 text-sm">{doctor.rating}</span>
                                </div>
                                <p className="text-xs text-stone-500">({doctor.reviews} reviews)</p>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditDoctor(doctor)}
                                    className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Edit doctor"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteConfirm('doctor', doctor.doctor_id, doctor.name)}
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete doctor"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Mobile/Tablet Layout - Stacked Card */}
                            <div className="lg:hidden">
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
                                  {doctor.image_url || doctor.image ? (
                                    <img 
                                      src={doctor.image_url || doctor.image} 
                                      alt={doctor.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                      <Users className="w-6 h-6 text-emerald-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-stone-800 text-lg">{doctor.name}</h3>
                                  <p className="text-stone-600 text-sm">{doctor.specialty}</p>
                                  <p className="text-stone-500 text-xs mt-1">{doctor.qualifications}</p>
                                  <div className="flex items-center gap-1 mt-2">
                                    <span className="text-yellow-500 text-sm">★</span>
                                    <span className="text-stone-600 text-sm">{doctor.rating}</span>
                                    <span className="text-stone-500 text-xs">({doctor.reviews} reviews)</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Location</p>
                                  <p className="text-stone-700 text-sm mt-1">{doctor.location}</p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Experience</p>
                                  <p className="text-stone-700 text-sm mt-1">{doctor.experience_years || doctor.experience} years</p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Price</p>
                                  <p className="text-stone-700 text-sm mt-1">IDR {doctor.price?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Languages</p>
                                  <p className="text-stone-700 text-sm mt-1">{doctor.languages?.join(', ') || 'English'}</p>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                                <button 
                                  onClick={() => handleEditDoctor(doctor)}
                                  className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteConfirm('doctor', doctor.doctor_id, doctor.name)}
                                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Medicines Section */}
            {activeSection === "medicines" && (
              <div className="p-8">
                {/* Sub-navigation for Medicine actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setMedicineMode("add")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      medicineMode === "add"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Add Medicine
                  </button>
                  <button
                    onClick={() => setMedicineMode("manage")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      medicineMode === "manage"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Manage Medicines ({medicines.length})
                  </button>
                </div>

                {medicineMode === "add" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-light text-stone-800 font-serif">
                        {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                      </h2>
                      {editingMedicine && (
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                <div className="space-y-8">
                  {/* Medicine Image Upload */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Medicine Photo
                    </h3>
                    <div className="flex items-start space-x-6 justify-center">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-stone-200">
                            {medicineImagePreview || medicineData.image_url ? (
                              <img
                                src={
                                  medicineImagePreview || medicineData.image_url
                                }
                                alt="Medicine preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <label className="w-full h-full bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMedicineImageUpload}
                                  disabled={uploadingMedicineImage}
                                  className="hidden"
                                />
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-1 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                    <Plus className="w-6 h-6 text-emerald-600" />
                                  </div>
                                </div>
                              </label>
                            )}
                          </div>
                          {/* Remove button when image exists */}
                          {(medicineImagePreview || medicineData.image_url) && (
                            <button
                              type="button"
                              onClick={removeMedicineImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          {/* Upload overlay when image exists */}
                          {(medicineImagePreview || medicineData.image_url) && (
                            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleMedicineImageUpload}
                                disabled={uploadingMedicineImage}
                                className="hidden"
                              />
                              <div className="text-center">
                                <Plus className="w-6 h-6 text-white mx-auto mb-1" />
                                <p className="text-xs text-white font-light">
                                  Change
                                </p>
                              </div>
                            </label>
                          )}
                          {/* Loading overlay */}
                          {uploadingMedicineImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={medicineData.name}
                          onChange={(e) =>
                            handleMedicineChange("name", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Paracetamol"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Generic Name
                        </label>
                        <input
                          type="text"
                          value={medicineData.generic_name}
                          onChange={(e) =>
                            handleMedicineChange("generic_name", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Acetaminophen"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Category *
                        </label>
                        <select
                          value={medicineData.category}
                          onChange={(e) =>
                            handleMedicineChange("category", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}

                          
                        >
                          <option value="">Select category</option>
                          {medicineCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={medicineData.dosage}
                          onChange={(e) =>
                            handleMedicineChange("dosage", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="500mg"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Price (IDR) *
                        </label>
                        <input
                          type="number"
                          value={medicineData.price || ""}
                          onChange={(e) =>
                            handleMedicineChange(
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="15000"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Stock *
                        </label>
                        <input
                          type="number"
                          value={medicineData.stock || ""}
                          onChange={(e) =>
                            handleMedicineChange(
                              "stock",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={medicineData.manufacturer}
                          onChange={(e) =>
                            handleMedicineChange("manufacturer", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Pfizer, Johnson & Johnson, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-stone-700 font-light mb-2">
                          Active Ingredient
                        </label>
                        <input
                          type="text"
                          value={medicineData.active_ingredient}
                          onChange={(e) =>
                            handleMedicineChange("active_ingredient", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Acetaminophen, Ibuprofen, etc."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-stone-700 font-light mb-2">
                          Description
                        </label>
                        <textarea
                          value={medicineData.description}
                          onChange={(e) =>
                            handleMedicineChange("description", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                          placeholder="Brief description of the medicine and its uses..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prescription Requirement */}
                  <div>
                    <h3 className="text-xl font-light text-stone-700 mb-4">
                      Prescription Requirement
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="radio"
                          name="prescription"
                          checked={!medicineData.requires_prescription}
                          onChange={() =>
                            handleMedicineChange("requires_prescription", false)
                          }
                          className="mr-3 w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-medium text-stone-700">
                            Over-the-counter (OTC)
                          </div>
                          <div className="text-sm text-stone-500 font-light">
                            Available without prescription
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="radio"
                          name="prescription"
                          checked={medicineData.requires_prescription}
                          onChange={() =>
                            handleMedicineChange("requires_prescription", true)
                          }
                          className="mr-3 w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-medium text-stone-700">
                            Prescription Required
                          </div>
                          <div className="text-sm text-stone-500 font-light">
                            Requires doctor's prescription
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                  </div>
                )}

                {medicineMode === "manage" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-light text-stone-800 font-serif">
                        Manage Medicines
                      </h2>
                      <button 
                        onClick={loadData}
                        disabled={loadingData}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        {loadingData ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    {dataError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">Error loading medicines: {dataError}</p>
                        <button 
                          onClick={loadData}
                          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {loadingData ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-stone-600 font-light">Loading medicines...</p>
                      </div>
                    ) : medicines.length === 0 ? (
                      <div className="text-center py-12">
                        <Pill className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500 font-light text-lg">No medicines found</p>
                        <p className="text-stone-400 font-light">Add your first medicine to get started</p>
                        <button 
                          onClick={() => setMedicineMode("add")}
                          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                        >
                          Add Medicine
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Desktop Table Header - Hidden on mobile */}
                        <div className="hidden lg:block bg-stone-50 border border-stone-200 rounded-lg p-4 font-medium text-stone-700 text-sm">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">Photo</div>
                            <div className="col-span-2">Name</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-1">Stock</div>
                            <div className="col-span-1">Price</div>
                            <div className="col-span-1">Dosage</div>
                            <div className="col-span-2">Prescription</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                        </div>

                        {/* Data rows - Responsive */}
                        {medicines.map((medicine, index) => (
                          <div key={medicine.medicine_id || `medicine-${index}`} className="bg-white border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                            {/* Desktop Layout */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100">
                                  {medicine.image_url || medicine.image ? (
                                    <img 
                                      src={medicine.image_url || medicine.image} 
                                      alt={medicine.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                      <Pill className="w-4 h-4 text-emerald-600" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <p className="font-medium text-stone-800">{medicine.name}</p>
                                {medicine.generic_name && (
                                  <p className="text-xs text-stone-500">({medicine.generic_name})</p>
                                )}
                                {medicine.manufacturer && (
                                  <p className="text-xs text-stone-500">by {medicine.manufacturer}</p>
                                )}
                              </div>
                              <div className="col-span-2">
                                <p className="text-stone-700">{medicine.category}</p>
                                {medicine.active_ingredient && (
                                  <p className="text-xs text-stone-500">{medicine.active_ingredient}</p>
                                )}
                              </div>
                              <div className="col-span-1">
                                <p className={`text-sm font-medium ${
                                  medicine.stock > 10 ? 'text-green-600' : 
                                  medicine.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {medicine.stock}
                                </p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-stone-600 text-sm">IDR {medicine.price?.toLocaleString()}</p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-stone-600 text-sm">{medicine.dosage || 'N/A'}</p>
                              </div>
                              <div className="col-span-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  medicine.requires_prescription
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {medicine.requires_prescription ? "Rx Required" : "OTC"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditMedicine(medicine)}
                                    className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Edit medicine"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteConfirm('medicine', medicine.medicine_id, medicine.name)}
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete medicine"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Mobile/Tablet Layout - Stacked Card */}
                            <div className="lg:hidden">
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
                                  {medicine.image_url || medicine.image ? (
                                    <img 
                                      src={medicine.image_url || medicine.image} 
                                      alt={medicine.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                                      <Pill className="w-6 h-6 text-emerald-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-stone-800 text-lg">{medicine.name}</h3>
                                  {medicine.generic_name && (
                                    <p className="text-stone-600 text-sm">({medicine.generic_name})</p>
                                  )}
                                  <p className="text-stone-600 text-sm">{medicine.category}</p>
                                  {medicine.manufacturer && (
                                    <p className="text-stone-500 text-xs mt-1">by {medicine.manufacturer}</p>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    medicine.requires_prescription
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-green-100 text-green-700"
                                  }`}>
                                    {medicine.requires_prescription ? "Rx Required" : "OTC"}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Stock Level</p>
                                  <p className={`text-sm font-medium mt-1 ${
                                    medicine.stock > 10 ? 'text-green-600' : 
                                    medicine.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {medicine.stock} units
                                  </p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Price</p>
                                  <p className="text-stone-700 text-sm mt-1">IDR {medicine.price?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Dosage</p>
                                  <p className="text-stone-700 text-sm mt-1">{medicine.dosage || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Active Ingredient</p>
                                  <p className="text-stone-700 text-sm mt-1">{medicine.active_ingredient || 'N/A'}</p>
                                </div>
                              </div>
                              
                              {/* Description */}
                              {medicine.description && (
                                <div className="mb-4">
                                  <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">Description</p>
                                  <p className="text-stone-600 text-sm mt-1 line-clamp-2">{medicine.description}</p>
                                </div>
                              )}
                              
                              {/* Actions */}
                              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                                <button 
                                  onClick={() => handleEditMedicine(medicine)}
                                  className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteConfirm('medicine', medicine.medicine_id, medicine.name)}
                                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Save Button - only show for add modes */}
            {((activeSection === "doctors" && doctorMode === "add") || (activeSection === "medicines" && medicineMode === "add")) && (
              <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 rounded-b-2xl">
                <div className="flex justify-end items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (activeSection === "doctors" && doctorMode === "add" && !validationState.doctor) || (activeSection === "medicines" && medicineMode === "add" && !validationState.medicine)}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </span>
                    ) : (
                      `${(activeSection === "doctors" && editingDoctor) || (activeSection === "medicines" && editingMedicine) ? 'Update' : 'Add'} ${activeSection === "doctors" ? "Doctor" : "Medicine"}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  Confirm Delete
                </h2>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8">
                <p className="text-stone-600 mb-4">
                  Are you sure you want to delete this {showDeleteConfirm.type}?
                </p>
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="font-medium text-stone-800">{showDeleteConfirm.name}</p>
                  <p className="text-sm text-stone-500">ID: {showDeleteConfirm.id}</p>
                </div>
                <p className="text-red-600 text-sm mt-4">
                  ⚠️ This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'doctor') {
                      handleDeleteDoctor(showDeleteConfirm.id);
                    } else {
                      handleDeleteMedicine(showDeleteConfirm.id);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
