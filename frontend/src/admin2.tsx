import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  User,
  Star,
  MapPin,
  Calendar,
} from "lucide-react";
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
  created_at?: string;
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
  created_at?: string;
}

// Mock data
const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    rating: 4.8,
    reviews: 127,
    experience: 12,
    location: "Jakarta Medical Center",
    availability: ["Monday", "Wednesday", "Friday"],
    price: 500000,
    image: "",
    bio: "Experienced cardiologist specializing in heart disease prevention.",
    languages: ["Indonesian", "English"],
    image_url: "",
    qualifications: "MD, FACC",
    available_days: ["Monday", "Wednesday", "Friday"],
    available_slots: ["09:00", "10:00", "11:00", "14:00"],
    created_at: "2024-08-20",
  },
  {
    id: "2",
    name: "Dr. Ahmad Rahman",
    specialty: "General Practice",
    rating: 4.6,
    reviews: 89,
    experience: 8,
    location: "Menteng Health Clinic",
    availability: ["Tuesday", "Thursday", "Saturday"],
    price: 300000,
    image: "",
    bio: "General practitioner with focus on family medicine.",
    languages: ["Indonesian", "English", "Arabic"],
    image_url: "",
    qualifications: "MD, MRCGP",
    available_days: ["Tuesday", "Thursday", "Saturday"],
    available_slots: ["08:00", "09:00", "13:00", "14:00"],
    created_at: "2024-08-19",
  },
];

const mockMedicines: Medicine[] = [
  {
    medicine_id: "1",
    name: "Paracetamol",
    generic_name: "Acetaminophen",
    category: "Pain Relief",
    dosage: "500mg",
    price: 15000,
    stock: 150,
    manufacturer: "Kimia Farma",
    requires_prescription: false,
    description: "Over-the-counter pain reliever and fever reducer.",
    active_ingredient: "Acetaminophen 500mg",
    created_at: "2024-08-21",
  },
  {
    medicine_id: "2",
    name: "Amoxicillin",
    generic_name: "Amoxicillin",
    category: "Antibiotic",
    dosage: "250mg",
    price: 45000,
    stock: 75,
    manufacturer: "Dexa Medica",
    requires_prescription: true,
    description: "Broad-spectrum antibiotic for bacterial infections.",
    active_ingredient: "Amoxicillin 250mg",
    created_at: "2024-08-20",
  },
];

const ManageRecords = () => {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"doctors" | "medicines">(
    "doctors"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedItem, setSelectedItem] = useState<Doctor | Medicine | null>(
    null
  );
  const [modalType, setModalType] = useState<"view" | "edit" | "delete" | null>(
    null
  );
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initAuth();
    loadData();
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

  const loadData = async () => {
    try {
      // Use real backend fetch functions
      // @ts-ignore
      const { fetchDoctors, fetchMedicines } = await import(
        "./services/flaskService"
      );
      const doctors = await fetchDoctors();
      const medicines = await fetchMedicines();
      setDoctors(Array.isArray(doctors) ? doctors : []);
      setMedicines(Array.isArray(medicines) ? medicines : []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor &&
        doctor.name &&
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor &&
        doctor.specialty &&
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor &&
        doctor.location &&
        doctor.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredMedicines = medicines.filter(
    (medicine) =>
      (medicine &&
        medicine.name &&
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (medicine &&
        medicine.generic_name &&
        medicine.generic_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (medicine &&
        medicine.category &&
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (medicine &&
        medicine.manufacturer &&
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const recentlyAdded =
    activeTab === "doctors"
      ? doctors
          .sort(
            (a, b) =>
              new Date(b.created_at || "").getTime() -
              new Date(a.created_at || "").getTime()
          )
          .slice(0, 3)
      : medicines
          .sort(
            (a, b) =>
              new Date(b.created_at || "").getTime() -
              new Date(a.created_at || "").getTime()
          )
          .slice(0, 3);

  const handleView = (item: Doctor | Medicine) => {
    setSelectedItem(item);
    setModalType("view");
  };

  const handleEdit = (item: Doctor | Medicine) => {
    setSelectedItem(item);
    setModalType("edit");
  };

  const handleDelete = (item: Doctor | Medicine) => {
    setSelectedItem(item);
    setModalType("delete");
  };

  const confirmDelete = async () => {
    if (!selectedItem) {
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (activeTab === "doctors" && "doctor_id" in selectedItem) {
        setDoctors((prev) =>
          prev.filter((d) => d.doctor_id !== (selectedItem as Doctor).doctor_id)
        );
      } else if ("medicine_id" in selectedItem) {
        setMedicines((prev) =>
          prev.filter(
            (m) => m.medicine_id !== (selectedItem as Medicine).medicine_id
          )
        );
      }

      setSaveStatus({
        type: "success",
        message: `${
          activeTab === "doctors" ? "Doctor" : "Medicine"
        } deleted successfully`,
      });
      setModalType(null);
      setSelectedItem(null);
    } catch (error) {
      setSaveStatus({ type: "error", message: "Failed to delete item" });
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
            <p className="text-stone-600 font-light">Loading records...</p>
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
                  Manage Records
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

        <div className="p-8 max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("doctors")}
              className={tabClasses("doctors")}
            >
              Doctors ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab("medicines")}
              className={tabClasses("medicines")}
            >
              Medicines ({medicines.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Search ${
                    activeTab === "doctors"
                      ? "doctors by name, specialty, or location"
                      : "medicines by name, category, or manufacturer"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light text-lg placeholder:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Recently Added Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 mb-8">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-xl font-light text-stone-800 font-serif">
                Recently Added
              </h2>
            </div>
            <div className="p-6">
              {recentlyAdded.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyAdded.map((item) => (
                    <div
                      key={
                        activeTab === "doctors"
                          ? (item as Doctor).doctor_id
                          : (item as Medicine).medicine_id
                      }
                      className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {activeTab === "doctors" ? (
                        <DoctorCard
                          doctor={item as Doctor}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ) : (
                        <MedicineCard
                          medicine={item as Medicine}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <p>No {activeTab} added recently</p>
                </div>
              )}
            </div>
          </div>

          {/* All Records Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-stone-800 font-serif">
                  All {activeTab === "doctors" ? "Doctors" : "Medicines"}
                </h2>
                <div className="text-sm text-stone-500">
                  {searchTerm
                    ? `${
                        activeTab === "doctors"
                          ? filteredDoctors.length
                          : filteredMedicines.length
                      } results found`
                    : `${
                        activeTab === "doctors"
                          ? doctors.length
                          : medicines.length
                      } total records`}
                </div>
              </div>
            </div>
            <div className="p-6">
              {activeTab === "doctors" ? (
                filteredDoctors.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <DoctorCard
                          doctor={doctor}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <p>No doctors found matching your search</p>
                  </div>
                )
              ) : filteredMedicines.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMedicines.map((medicine) => (
                    <div
                      key={medicine.medicine_id}
                      className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <MedicineCard
                        medicine={medicine}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <p>No medicines found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && selectedItem && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {modalType === "view" && (
              <ViewModal
                item={selectedItem}
                type={activeTab === "doctors" ? "doctor" : "medicine"}
                onClose={() => setModalType(null)}
              />
            )}
            {modalType === "edit" && (
              <EditModal
                item={selectedItem}
                type={activeTab === "doctors" ? "doctor" : "medicine"}
                onClose={() => setModalType(null)}
                onSave={(updatedItem) => {
                  if (activeTab === "doctors" && "doctor_id" in updatedItem) {
                    setDoctors((prev) =>
                      prev.map((d) =>
                        d.doctor_id === (updatedItem as Doctor).doctor_id
                          ? (updatedItem as Doctor)
                          : d
                      )
                    );
                  } else if ("medicine_id" in updatedItem) {
                    setMedicines((prev) =>
                      prev.map((m) =>
                        m.medicine_id === (updatedItem as Medicine).medicine_id
                          ? (updatedItem as Medicine)
                          : m
                      )
                    );
                  }
                  setSaveStatus({
                    type: "success",
                    message: "Record updated successfully",
                  });
                  setTimeout(
                    () => setSaveStatus({ type: null, message: "" }),
                    3000
                  );
                }}
              />
            )}
            {modalType === "delete" && (
              <DeleteModal
                item={selectedItem}
                type={activeTab === "doctors" ? "doctor" : "medicine"}
                onClose={() => setModalType(null)}
                onConfirm={confirmDelete}
                isLoading={isSaving}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Doctor Card Component
const DoctorCard = ({
  doctor,
  onView,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  onView: (item: Doctor) => void;
  onEdit: (item: Doctor) => void;
  onDelete: (item: Doctor) => void;
}) => (
  <div>
    <div className="flex items-start space-x-4 mb-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
        {doctor.image_url ? (
          <img
            src={doctor.image_url}
            alt={doctor.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-emerald-600" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-stone-800">{doctor.name}</h3>
        <p className="text-sm text-stone-600">{doctor.specialty}</p>
        <div className="flex items-center mt-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm text-stone-600 ml-1">
            {doctor.rating} ({doctor.reviews} reviews)
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center text-sm text-stone-600">
        <MapPin className="w-4 h-4 mr-2" />
        {doctor.location}
      </div>
      <div className="flex items-center text-sm text-stone-600">
        <Calendar className="w-4 h-4 mr-2" />
        {doctor.experience} years experience
      </div>
      <div className="text-sm text-emerald-600 font-medium">
        IDR {doctor.price.toLocaleString()}
      </div>
    </div>

    <div className="flex space-x-2">
      <button
        onClick={() => onView(doctor)}
        className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </button>
      <button
        onClick={() => onEdit(doctor)}
        className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Edit className="w-4 h-4 mr-1" />
        Edit
      </button>
      <button
        onClick={() => onDelete(doctor)}
        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </button>
    </div>
  </div>
);

// Medicine Card Component
const MedicineCard = ({
  medicine,
  onView,
  onEdit,
  onDelete,
}: {
  medicine: Medicine;
  onView: (item: Medicine) => void;
  onEdit: (item: Medicine) => void;
  onDelete: (item: Medicine) => void;
}) => (
  <div>
    <div className="mb-4">
      <h3 className="font-medium text-stone-800">{medicine.name}</h3>
      {medicine.generic_name && (
        <p className="text-sm text-stone-600">{medicine.generic_name}</p>
      )}
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Category:</span>
          <span className="text-stone-800">{medicine.category}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Stock:</span>
          <span
            className={`font-medium ${
              medicine.stock < 50 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {medicine.stock}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Price:</span>
          <span className="text-emerald-600 font-medium">
            IDR {medicine.price.toLocaleString()}
          </span>
        </div>
        {medicine.requires_prescription && (
          <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
            Prescription Required
          </div>
        )}
      </div>
    </div>

    <div className="flex space-x-2">
      <button
        onClick={() => onView(medicine)}
        className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </button>
      <button
        onClick={() => onEdit(medicine)}
        className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Edit className="w-4 h-4 mr-1" />
        Edit
      </button>
      <button
        onClick={() => onDelete(medicine)}
        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center justify-center"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </button>
    </div>
  </div>
);

// View Modal Component
const ViewModal = ({
  item,
  type,
  onClose,
}: {
  item: Doctor | Medicine;
  type: "doctor" | "medicine";
  onClose: () => void;
}) => (
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-light text-stone-800 font-serif">
        {type === "doctor" ? "Doctor Details" : "Medicine Details"}
      </h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-stone-500" />
      </button>
    </div>

    {type === "doctor" ? (
      <DoctorDetails doctor={item as Doctor} />
    ) : (
      <MedicineDetails medicine={item as Medicine} />
    )}

    <div className="flex justify-end mt-6">
      <button
        onClick={onClose}
        className="px-6 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
      >
        Close
      </button>
    </div>
  </div>
);

// Edit Modal Component
const EditModal = ({
  item,
  type,
  onClose,
  onSave,
}: {
  item: Doctor | Medicine;
  type: "doctor" | "medicine";
  onClose: () => void;
  onSave: (item: Doctor | Medicine) => void;
}) => {
  const [editedItem, setEditedItem] = useState(item);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-stone-800 font-serif">
          Edit {type === "doctor" ? "Doctor" : "Medicine"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {type === "doctor" ? (
          <>
            <div>
              <label className="block text-stone-700 font-light mb-2">
                Name
              </label>
              <input
                type="text"
                value={(editedItem as Doctor).name}
                onChange={(e) =>
                  setEditedItem(
                    (prev) => ({ ...prev, name: e.target.value } as Doctor)
                  )
                }
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-light"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-light mb-2">
                Specialty
              </label>
              <input
                type="text"
                value={(editedItem as Doctor).specialty}
                onChange={(e) =>
                  setEditedItem(
                    (prev) => ({ ...prev, specialty: e.target.value } as Doctor)
                  )
                }
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-light"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-stone-700 font-light mb-2">
                Name
              </label>
              <input
                type="text"
                value={(editedItem as Medicine).name}
                onChange={(e) =>
                  setEditedItem(
                    (prev) => ({ ...prev, name: e.target.value } as Medicine)
                  )
                }
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-light"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-light mb-2">
                Stock
              </label>
              <input
                type="number"
                value={(editedItem as Medicine).stock}
                onChange={(e) =>
                  setEditedItem(
                    (prev) =>
                      ({ ...prev, stock: parseInt(e.target.value) } as Medicine)
                  )
                }
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-light"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Delete Modal Component
const DeleteModal = ({
  item,
  type,
  onClose,
  onConfirm,
  isLoading,
}: {
  item: Doctor | Medicine;
  type: "doctor" | "medicine";
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) => (
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-light text-stone-800 font-serif">
        Delete {type === "doctor" ? "Doctor" : "Medicine"}
      </h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-stone-500" />
      </button>
    </div>

    <div className="mb-6">
      <p className="text-stone-600 mb-4">
        Are you sure you want to delete{" "}
        {type === "doctor" ? (item as Doctor).name : (item as Medicine).name}?
      </p>
      <p className="text-sm text-red-600">This action cannot be undone.</p>
    </div>

    <div className="flex justify-end space-x-3">
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Deleting...
          </>
        ) : (
          "Delete"
        )}
      </button>
    </div>
  </div>
);

// Doctor Details Component
const DoctorDetails = ({ doctor }: { doctor: Doctor }) => (
  <div className="space-y-6">
    <div className="flex items-start space-x-6">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
        {doctor.image_url ? (
          <img
            src={doctor.image_url}
            alt={doctor.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-10 h-10 text-emerald-600" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-medium text-stone-800">{doctor.name}</h3>
        <p className="text-stone-600">{doctor.specialty}</p>
        <div className="flex items-center mt-2">
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
          <span className="text-stone-600 ml-2">
            {doctor.rating} ({doctor.reviews} reviews)
          </span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium text-stone-800 mb-3">
          Professional Information
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Experience:</span>
            <span className="text-stone-800">{doctor.experience} years</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Qualifications:</span>
            <span className="text-stone-800">{doctor.qualifications}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Consultation Fee:</span>
            <span className="text-emerald-600 font-medium">
              IDR {doctor.price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Location:</span>
            <span className="text-stone-800">{doctor.location}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-stone-800 mb-3">Availability</h4>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-stone-600">Available Days:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {doctor.available_days?.map((day) => (
                <span
                  key={day}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm text-stone-600">Time Slots:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {doctor.available_slots?.map((slot) => (
                <span
                  key={slot}
                  className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded"
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h4 className="font-medium text-stone-800 mb-3">Languages</h4>
      <div className="flex flex-wrap gap-2">
        {doctor.languages.map((language) => (
          <span
            key={language}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded"
          >
            {language}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h4 className="font-medium text-stone-800 mb-3">Biography</h4>
      <p className="text-stone-600 text-sm leading-relaxed">{doctor.bio}</p>
    </div>
  </div>
);

// Medicine Details Component
const MedicineDetails = ({ medicine }: { medicine: Medicine }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-medium text-stone-800">{medicine.name}</h3>
      {medicine.generic_name && (
        <p className="text-stone-600">Generic: {medicine.generic_name}</p>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium text-stone-800 mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Category:</span>
            <span className="text-stone-800">{medicine.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Dosage:</span>
            <span className="text-stone-800">{medicine.dosage || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Manufacturer:</span>
            <span className="text-stone-800">
              {medicine.manufacturer || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Active Ingredient:</span>
            <span className="text-stone-800">
              {medicine.active_ingredient || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-stone-800 mb-3">Inventory & Pricing</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Price:</span>
            <span className="text-emerald-600 font-medium">
              IDR {medicine.price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Stock:</span>
            <span
              className={`font-medium ${
                medicine.stock < 50 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {medicine.stock} units
              {medicine.stock < 50 && (
                <span className="text-red-600 ml-1">(Low Stock)</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Prescription:</span>
            <span
              className={`font-medium ${
                medicine.requires_prescription
                  ? "text-orange-600"
                  : "text-emerald-600"
              }`}
            >
              {medicine.requires_prescription ? "Required" : "Not Required"}
            </span>
          </div>
        </div>
      </div>
    </div>

    {medicine.description && (
      <div>
        <h4 className="font-medium text-stone-800 mb-3">Description</h4>
        <p className="text-stone-600 text-sm leading-relaxed">
          {medicine.description}
        </p>
      </div>
    )}
  </div>
);

export default ManageRecords;
