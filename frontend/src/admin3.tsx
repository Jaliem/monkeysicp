import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import {
  Eye,
  Calendar,
  ShoppingCart,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import NavbarAdmin from "./navAdmin";
import { fetchAllAppointments, fetchAllMedicineOrders } from "./services/flaskService";

interface Order {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled' | 'confirmed';
  orderDate: string;
  pharmacyName: string;
  userId: string;
  userName: string;
  userEmail?: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed';
  userId: string;
  userName: string;
  userEmail?: string;
  location?: string;
}

const UserActivity = () => {
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"appointments" | "orders">("appointments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedItem, setSelectedItem] = useState<Order | Appointment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

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
      console.log("Loading user activity data from backend...");
      
      // Fetch real appointments data
      const appointmentsData = await fetchAllAppointments();
      console.log("Raw appointments data:", appointmentsData);
      
      // Transform appointments data to match our interface
      const transformedAppointments = appointmentsData.map((apt: any, index: number) => ({
        id: apt.appointment_id || `apt-${index}`,
        doctorId: apt.doctor_id || apt.doctorId || 'N/A',
        doctorName: apt.doctor_name || apt.doctorName || 'Unknown Doctor',
        specialty: apt.specialty || 'General',
        date: apt.appointment_date || apt.date || new Date().toISOString().split('T')[0],
        time: apt.appointment_time || apt.time || '09:00',
        type: apt.appointment_type || apt.type || 'consultation',
        status: apt.status || 'scheduled',
        userId: apt.user_id || apt.userId || 'N/A',
        userName: apt.user_name || apt.userName || 'Unknown User',
        userEmail: apt.user_email || apt.userEmail || undefined,
        location: apt.location || 'Medical Center'
      }));
      
      // Fetch real orders data
      const ordersData = await fetchAllMedicineOrders();
      console.log("Raw orders data:", ordersData);
      
      // Transform orders data to match our interface  
      const transformedOrders = ordersData.map((order: any, index: number) => ({
        id: order.order_id || order.id || `order-${index}`,
        medicineId: order.medicine_id || order.medicineId || 'N/A',
        medicineName: order.medicine_name || order.medicineName || 'Unknown Medicine',
        quantity: order.quantity || 1,
        totalPrice: order.total_price || order.totalPrice || 0,
        status: order.status || 'pending',
        orderDate: order.order_date || order.orderDate || order.created_at || new Date().toISOString().split('T')[0],
        pharmacyName: order.pharmacy_name || order.pharmacyName || 'Online Pharmacy',
        userId: order.user_id || order.userId || 'N/A',
        userName: order.user_name || order.userName || 'Unknown User',
        userEmail: order.user_email || order.userEmail || undefined
      }));
      
      console.log("Transformed appointments:", transformedAppointments.length);
      console.log("Transformed orders:", transformedOrders.length);
      
      setAppointments(transformedAppointments);
      setOrders(transformedOrders);
      
    } catch (error) {
      console.error("Error loading data:", error);
      // If backend fails, just leave the arrays empty
      setOrders([]);
      setAppointments([]);
    }
  };

  // Filter functions
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.userEmail && appointment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get recent activities (last 7 days)
  const recentActivities = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAppointments = appointments
      .filter(apt => new Date(apt.date) >= sevenDaysAgo)
      .map(apt => ({ ...apt, type: 'appointment' as const }));
    
    const recentOrders = orders
      .filter(order => new Date(order.orderDate) >= sevenDaysAgo)
      .map(order => ({ ...order, type: 'order' as const }));
    
    return [...recentAppointments, ...recentOrders]
      .sort((a, b) => {
        const dateA = 'date' in a ? new Date(a.date) : new Date(a.orderDate);
        const dateB = 'date' in b ? new Date(b.date) : new Date(b.orderDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  const getStatusColor = (status: string, type: 'appointment' | 'order') => {
    const colors = {
      appointment: {
        scheduled: 'bg-blue-100 text-blue-700',
        confirmed: 'bg-green-100 text-green-700',
        completed: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700'
      },
      order: {
        pending: 'bg-yellow-100 text-yellow-700',
        processing: 'bg-blue-100 text-blue-700',
        ready: 'bg-purple-100 text-purple-700',
        delivered: 'bg-green-100 text-green-700',
        confirmed: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700'
      }
    };
    return colors[type][status as keyof typeof colors[typeof type]] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'processing':
      case 'ready':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleView = (item: Order | Appointment) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const tabClasses = (tab: string) =>
    `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      activeTab === tab
        ? "bg-emerald-600 text-white shadow-md"
        : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
    }`;

  const exportData = () => {
    const dataToExport = activeTab === 'appointments' ? filteredAppointments : filteredOrders;
    
    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(dataToExport[0] || {}).join(",") + "\n" +
      dataToExport.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-stone-600 font-light">Loading user activities...</p>
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
                  User Activities
                </h1>
              </div>
              {principal && (
                <div className="text-right">
                  <p className="text-sm text-stone-500 font-light">Principal ID</p>
                  <p className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-1 rounded">
                    {principal.substring(0, 8)}...{principal.substring(principal.length - 8)}
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
              onClick={() => setActiveTab("appointments")}
              className={tabClasses("appointments")}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={tabClasses("orders")}
            >
              <ShoppingCart className="w-4 h-4 mr-2 inline" />
              Orders ({orders.length})
            </button>
          </div>

          {/* Filters and Search */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Search ${
                    activeTab === "appointments"
                      ? "by user name, doctor, specialty, or email"
                      : "by user name, medicine, pharmacy, or email"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light text-lg placeholder:opacity-30"
                />
              </div>
              <div className="flex space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-4 pr-8 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light bg-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                >
                  <option value="all">All Status</option>
                  {activeTab === "appointments" ? (
                    <>
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
                <button
                  onClick={exportData}
                  className="px-4 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-medium flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 mb-8">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-xl font-light text-stone-800 font-serif">
                Recent Activities (Last 7 Days)
              </h2>
            </div>
            <div className="p-6">
              {recentActivities().length > 0 ? (
                <div className="space-y-4">
                  {recentActivities().map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          {activity.type === 'appointment' ? (
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ShoppingCart className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-stone-800">{activity.userName}</h4>
                          <p className="text-sm text-stone-600">
                            {activity.type === 'appointment' 
                              ? `Appointment with ${(activity as Appointment).doctorName}`
                              : `Order: ${(activity as Order).medicineName}`
                            }
                          </p>
                          <p className="text-xs text-stone-500">
                            {activity.type === 'appointment' 
                              ? (activity as Appointment).date 
                              : (activity as Order).orderDate
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(activity.status, activity.type === 'appointment' ? 'appointment' : 'order')}`}>
                          {getStatusIcon(activity.status)}
                          <span className="ml-1 capitalize">{activity.status}</span>
                        </span>
                        <button
                          onClick={() => handleView(activity)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 text-stone-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <p>No recent activities in the last 7 days</p>
                </div>
              )}
            </div>
          </div>

          {/* All Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-stone-800 font-serif">
                  All {activeTab === "appointments" ? "Appointments" : "Orders"}
                </h2>
                <div className="text-sm text-stone-500">
                  {searchTerm || statusFilter !== "all"
                    ? `${
                        activeTab === "appointments"
                          ? filteredAppointments.length
                          : filteredOrders.length
                      } results found`
                    : `${
                        activeTab === "appointments"
                          ? appointments.length
                          : orders.length
                      } total records`}
                </div>
              </div>
            </div>
            <div className="p-6">
              {activeTab === "appointments" ? (
                filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onView={handleView}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <p>No appointments found matching your criteria</p>
                  </div>
                )
              ) : (
                filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onView={handleView}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <p>No orders found matching your criteria</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <ViewModal
              item={selectedItem}
              type={'doctorName' in selectedItem ? 'appointment' : 'order'}
              onClose={() => setShowViewModal(false)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({
  appointment,
  onView,
  getStatusColor,
  getStatusIcon,
}: {
  appointment: Appointment;
  onView: (item: Appointment) => void;
  getStatusColor: (status: string, type: 'appointment' | 'order') => string;
  getStatusIcon: (status: string) => React.ReactNode;
}) => (
  <div className="border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-medium text-stone-800">{appointment.userName}</h3>
            <p className="text-sm text-stone-600">{appointment.userEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-stone-500">Doctor</p>
            <p className="font-medium text-stone-800">{appointment.doctorName}</p>
            <p className="text-sm text-stone-600">{appointment.specialty}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Appointment</p>
            <p className="font-medium text-stone-800">{appointment.date}</p>
            <p className="text-sm text-stone-600">{appointment.time}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(appointment.status, 'appointment')}`}>
            {getStatusIcon(appointment.status)}
            <span className="ml-1 capitalize">{appointment.status}</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
            appointment.type === 'emergency' ? 'bg-red-100 text-red-700' :
            appointment.type === 'follow-up' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {appointment.type}
          </span>
        </div>
      </div>

      <button
        onClick={() => onView(appointment)}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <Eye className="w-5 h-5 text-stone-600" />
      </button>
    </div>
  </div>
);

// Order Card Component
const OrderCard = ({
  order,
  onView,
  getStatusColor,
  getStatusIcon,
}: {
  order: Order;
  onView: (item: Order) => void;
  getStatusColor: (status: string, type: 'appointment' | 'order') => string;
  getStatusIcon: (status: string) => React.ReactNode;
}) => (
  <div className="border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-medium text-stone-800">{order.userName}</h3>
            <p className="text-sm text-stone-600">{order.userEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-stone-500">Medicine</p>
            <p className="font-medium text-stone-800">{order.medicineName}</p>
            <p className="text-sm text-stone-600">Qty: {order.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500">Pharmacy</p>
            <p className="font-medium text-stone-800">{order.pharmacyName}</p>
            <p className="text-sm text-emerald-600 font-medium">IDR {order.totalPrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status, 'order')}`}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </span>
          <span className="text-sm text-stone-500">
            {order.orderDate}
          </span>
        </div>
      </div>

      <button
        onClick={() => onView(order)}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
      >
        <Eye className="w-5 h-5 text-stone-600" />
      </button>
    </div>
  </div>
);

// View Modal Component
const ViewModal = ({
  item,
  type,
  onClose,
  getStatusColor,
  getStatusIcon,
}: {
  item: Order | Appointment;
  type: 'appointment' | 'order';
  onClose: () => void;
  getStatusColor: (status: string, type: 'appointment' | 'order') => string;
  getStatusIcon: (status: string) => React.ReactNode;
}) => (
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-light text-stone-800 font-serif">
        {type === "appointment" ? "Appointment Details" : "Order Details"}
      </h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
      >
        ×
      </button>
    </div>

    <div className="space-y-6">
      {/* User Information */}
      <div className="bg-stone-50 rounded-lg p-4">
        <h3 className="font-medium text-stone-800 mb-3">User Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-stone-600">Name</p>
            <p className="font-medium">{item.userName}</p>
          </div>
          <div>
            <p className="text-sm text-stone-600">Email</p>
            <p className="font-medium">{item.userEmail || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-stone-600">User ID</p>
            <p className="font-mono text-sm">{item.userId}</p>
          </div>
          <div>
            <p className="text-sm text-stone-600">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(item.status, type)}`}>
              {getStatusIcon(item.status)}
              <span className="ml-1 capitalize">{item.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Specific Details */}
      {type === 'appointment' ? (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-stone-800 mb-3">Appointment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-stone-600">Doctor</p>
              <p className="font-medium">{(item as Appointment).doctorName}</p>
              <p className="text-sm text-stone-600">{(item as Appointment).specialty}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Date & Time</p>
              <p className="font-medium">{(item as Appointment).date}</p>
              <p className="text-sm text-stone-600">{(item as Appointment).time}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Type</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                (item as Appointment).type === 'emergency' ? 'bg-red-100 text-red-700' :
                (item as Appointment).type === 'follow-up' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {(item as Appointment).type}
              </span>
            </div>
            <div>
              <p className="text-sm text-stone-600">Location</p>
              <p className="font-medium">{(item as Appointment).location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Doctor ID</p>
              <p className="font-mono text-sm">{(item as Appointment).doctorId}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Appointment ID</p>
              <p className="font-mono text-sm">{item.id}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-lg p-4">
          <h3 className="font-medium text-stone-800 mb-3">Order Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-stone-600">Medicine</p>
              <p className="font-medium">{(item as Order).medicineName}</p>
              <p className="text-sm text-stone-600">Medicine ID: {(item as Order).medicineId}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Quantity</p>
              <p className="font-medium">{(item as Order).quantity} units</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Total Price</p>
              <p className="font-medium text-emerald-600">IDR {(item as Order).totalPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Order Date</p>
              <p className="font-medium">{(item as Order).orderDate}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Pharmacy</p>
              <p className="font-medium">{(item as Order).pharmacyName}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Order ID</p>
              <p className="font-mono text-sm">{item.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline/History Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-stone-800 mb-3">Status History</h3>
        <div className="space-y-2">
          {/* Mock timeline - in real app, this would come from backend */}
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800">
                Current Status: <span className="capitalize">{item.status}</span>
              </p>
              <p className="text-xs text-stone-500">
                {type === 'appointment' ? (item as Appointment).date : (item as Order).orderDate}
              </p>
            </div>
          </div>
          
          {item.status !== 'cancelled' && (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-stone-600">
                    {type === 'appointment' ? 'Appointment scheduled' : 'Order placed'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {type === 'appointment' 
                      ? new Date((item as Appointment).date).toLocaleDateString()
                      : new Date((item as Order).orderDate).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
              
              {(item.status === 'confirmed' || item.status === 'completed' || item.status === 'delivered') && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-stone-600">
                      {type === 'appointment' ? 'Appointment confirmed' : 'Order confirmed'}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {item.status === 'cancelled' && (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">
                  {type === 'appointment' ? 'Appointment cancelled' : 'Order cancelled'}
                </p>
                <p className="text-xs text-stone-500">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

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

export default UserActivity;