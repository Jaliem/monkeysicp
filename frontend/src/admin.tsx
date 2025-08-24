import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Plus, X } from "lucide-react";
import NavbarAdmin from "./navAdmin";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: number;
  location: string;
  availability: string[];
  price: number;
  image: string;
  bio: string;
  languages: string[];
  image_url: string;
  qualifications?: string;
  available_days?: string[];
  available_slots?: string[];
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
  const [activeTab, setActiveTab] = useState<"doctor" | "medicine">("doctor");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [doctorData, setDoctorData] = useState<Doctor>({
    id: "",
    name: "",
    specialty: "",
    rating: 0,
    reviews: 0,
    experience: 0,
    location: "",
    availability: [],
    price: 0,
    image: "",
    bio: "",
    languages: [],
    image_url: "",
    qualifications: "",
    available_days: [],
    available_slots: [],
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
  }, []);

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
        data.location,
        data.bio,
        data.qualifications,
      ].every((field) => field && field.trim() !== "") &&
      data.experience > 0 &&
      data.price > 0 &&
      data.available_days &&
      data.available_days.length > 0 &&
      data.available_slots &&
      data.available_slots.length > 0 &&
      data.languages &&
      data.languages.length > 0
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
      doctor: validateDoctorData(doctorData),
      medicine: validateMedicineData(medicineData),
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
      activeTab === "doctor"
        ? validationState.doctor
        : validationState.medicine;
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
      // Generate ID if not provided
      const currentData = activeTab === "doctor" ? doctorData : medicineData;
      if (!currentData.id && !currentData.medicine_id) {
        const newId = Date.now().toString();
        if (activeTab === "doctor") {
          handleDoctorChange("id", newId);
        } else {
          handleMedicineChange("medicine_id", newId);
        }
      }

      // Call backend service
      let result;
      if (activeTab === "doctor") {
        // @ts-ignore
        const { storeDoctor } = await import("./services/flaskService");
        result = await storeDoctor(doctorData);
      } else {
        // @ts-ignore
        const { storeMedicine } = await import("./services/flaskService");
        result = await storeMedicine(medicineData);
      }

      if (result && result.success !== false) {
        setSaveStatus({
          type: "success",
          message: `${
            activeTab === "doctor" ? "Doctor" : "Medicine"
          } added successfully!`,
        });
        // Reset form after successful save
        if (activeTab === "doctor") {
          setDoctorData({
            id: "",
            name: "",
            specialty: "",
            rating: 0,
            reviews: 0,
            experience: 0,
            location: "",
            availability: [],
            price: 0,
            image: "",
            bio: "",
            languages: [],
            image_url: "",
            qualifications: "",
            available_days: [],
            available_slots: [],
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

  const tabClasses = (tab: string) =>
    `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      activeTab === tab
        ? "bg-emerald-600 text-white shadow-md"
        : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
    }`;

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
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("doctor")}
              className={tabClasses("doctor")}
            >
              Add Doctor
            </button>
            <button
              onClick={() => setActiveTab("medicine")}
              className={tabClasses("medicine")}
            >
              Add Medicine
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            {/* Doctor Tab */}
            {activeTab === "doctor" && (
              <div className="p-8">
                <h2 className="text-2xl font-light text-stone-800 font-serif mb-6">
                  Add New Doctor
                </h2>

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
                          value={doctorData.experience || ""}
                          onChange={(e) =>
                            handleDoctorChange(
                              "experience",
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
                            checked={doctorData.languages.includes(language)}
                            onChange={() =>
                              handleArrayToggle(
                                doctorData.languages,
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

            {/* Medicine Tab */}
            {activeTab === "medicine" && (
              <div className="p-8">
                <h2 className="text-2xl font-light text-stone-800 font-serif mb-6">
                  Add New Medicine
                </h2>

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

            {/* Save Button */}
            <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 rounded-b-2xl">
              <div className="flex justify-end items-center">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !validationState[activeTab]}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    `Add ${activeTab === "doctor" ? "Doctor" : "Medicine"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
