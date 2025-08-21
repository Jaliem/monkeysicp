import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';

// Side Navigation Component matching your styling
const Navbar = () => {
  const navigate = useNavigate();
  const logout = async () => {
    const client = await AuthClient.create();
    await client.logout();
    navigate('/');
  };

  const navItems = [
    {
      name: 'Chat',
      path: '/chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'Doctor',
      path: '/doctor',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Pharmacy',
      path: '/pharmacy',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="w-64 h-screen bg-white shadow-xl border-r border-stone-200 flex flex-col font-serif">
      {/* Logo Section */}
      <div className="p-8 border-b border-stone-100">
        <div className="text-3xl font-light text-emerald-700 tracking-wide">
          Cura.
        </div>
        <div className="w-12 h-1 bg-emerald-400 mt-2 rounded-full"></div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-8">
        <div className="space-y-2 px-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className={`group flex items-center px-6 py-4 rounded-xl transition-all duration-300 font-light text-lg ${
                item.name === 'Doctor'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-stone-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <div className={`transition-colors duration-300 mr-4 ${
                item.name === 'Doctor'
                  ? 'text-emerald-600'
                  : 'text-stone-400 group-hover:text-emerald-600'
              }`}>
                {item.icon}
              </div>
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                {item.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-stone-100">
        <button
          onClick={logout}
          className="w-full flex items-center px-6 py-4 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-light text-lg group"
        >
          <div className="text-stone-400 group-hover:text-red-600 transition-colors duration-300 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="group-hover:translate-x-1 transition-transform duration-300">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
};

// Configuration for the health agent backend
const CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai";
const BASE_URL = "http://127.0.0.1:4943";
const USER_ID = "user123"; // In a real app, this would come from authentication

const HEADERS = {
  "Host": `${CANISTER_ID}.localhost`,
  "Content-Type": "application/json"
};

export default function Doctor() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user appointments from the health agent backend
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_URL}/get-user-appointments`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ user_id: USER_ID })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const appointmentsList = Array.isArray(data) ? data : [];
      setAppointments(appointmentsList);
      
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
      // Load mock data on error for demonstration
      setAppointments(getMockAppointments());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration when backend is unavailable
  const getMockAppointments = () => [
    {
      appointment_id: "APT-20250821-ABC123",
      doctor_id: "card_001",
      doctor_name: "Dr. Amir Hassan",
      specialty: "Cardiology",
      patient_symptoms: "Chest pain, shortness of breath",
      appointment_date: "2025-08-25",
      appointment_time: "09:00",
      status: "confirmed",
      urgency: "high",
      created_at: "2025-08-21T10:30:00Z",
      user_id: "user123"
    },
    {
      appointment_id: "APT-20250821-DEF456",
      doctor_id: "derm_001", 
      doctor_name: "Dr. Bella Rodriguez",
      specialty: "Dermatology",
      patient_symptoms: "Skin rash, itching",
      appointment_date: "2025-08-23",
      appointment_time: "14:00",
      status: "confirmed",
      urgency: "normal",
      created_at: "2025-08-21T08:15:00Z",
      user_id: "user123"
    },
    {
      appointment_id: "APT-20250820-GHI789",
      doctor_id: "neuro_001",
      doctor_name: "Dr. Chen Wang", 
      specialty: "Neurology",
      patient_symptoms: "Frequent headaches, dizziness",
      appointment_date: "2025-08-22",
      appointment_time: "13:00",
      status: "completed",
      urgency: "normal",
      created_at: "2025-08-20T16:45:00Z",
      user_id: "user123"
    }
  ];

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'completed':
        return 'bg-stone-50 text-stone-700 border border-stone-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  };

  // Get urgency styling
  const getUrgencyStyle = (urgency) => {
    switch (urgency.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'normal':
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="flex h-screen bg-stone-50 font-serif">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-stone-800 mb-3 tracking-wide">
              Doctor Appointments
            </h1>
            <div className="w-16 h-1 bg-emerald-400 rounded-full mb-4"></div>
            <p className="text-stone-600 font-light text-lg">
              View and manage your scheduled medical consultations
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-amber-800 font-light">
                  Unable to connect to backend. Showing demo data. Error: {error}
                </span>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mb-8">
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-xl font-light text-lg transition-all duration-300 hover:shadow-lg"
            >
              {loading ? 'Refreshing...' : 'Refresh Appointments'}
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-400 border-t-transparent"></div>
            </div>
          ) : appointments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-stone-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-2xl font-light text-stone-700 mb-3">No appointments found</h3>
              <p className="text-stone-500 font-light text-lg">You don't have any booked appointments yet.</p>
            </div>
          ) : (
            /* Appointments List */
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <div key={appointment.appointment_id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="p-8">
                    {/* Header with status and urgency */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-light text-stone-800 mb-2 tracking-wide">
                          {appointment.doctor_name}
                        </h3>
                        <p className="text-stone-600 font-light text-lg">{appointment.specialty}</p>
                      </div>
                      <div className="flex space-x-3">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-light ${getStatusStyle(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-2 capitalize">{appointment.status}</span>
                        </span>
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-light ${getUrgencyStyle(appointment.urgency)}`}>
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="capitalize">{appointment.urgency} Priority</span>
                        </span>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div className="flex items-center text-stone-700">
                          <svg className="h-6 w-6 text-emerald-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6" />
                          </svg>
                          <div>
                            <p className="font-light text-lg mb-1">Date</p>
                            <p className="text-stone-600 font-light">{formatDate(appointment.appointment_date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-stone-700">
                          <svg className="h-6 w-6 text-emerald-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-light text-lg mb-1">Time</p>
                            <p className="text-stone-600 font-light">{formatTime(appointment.appointment_time)}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-stone-700">
                          <svg className="h-6 w-6 text-emerald-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className="font-light text-lg mb-1">Doctor ID</p>
                            <p className="text-stone-600 font-light font-mono text-sm bg-stone-50 px-3 py-1 rounded-lg">
                              {appointment.doctor_id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div>
                          <p className="font-light text-lg text-stone-700 mb-2">Appointment ID</p>
                          <p className="text-stone-600 font-light font-mono text-sm bg-stone-50 px-3 py-2 rounded-lg">
                            {appointment.appointment_id}
                          </p>
                        </div>

                        <div>
                          <p className="font-light text-lg text-stone-700 mb-2">Symptoms</p>
                          <p className="text-stone-600 font-light">
                            {appointment.patient_symptoms || 'No symptoms specified'}
                          </p>
                        </div>

                        <div>
                          <p className="font-light text-lg text-stone-700 mb-2">Booked On</p>
                          <p className="text-stone-600 font-light">
                            {new Date(appointment.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t border-stone-100">
                      <div className="flex space-x-4">
                        {appointment.status.toLowerCase() === 'confirmed' && (
                          <>
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-light text-lg transition-all duration-300 hover:shadow-lg">
                              Reschedule
                            </button>
                            <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-light text-lg transition-all duration-300 hover:shadow-lg">
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-6 py-3 rounded-xl font-light text-lg transition-all duration-300 hover:shadow-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {appointments.length > 0 && (
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-stone-200 p-8">
              <h3 className="text-2xl font-light text-stone-800 mb-6 tracking-wide">Appointment Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-light text-emerald-600 mb-2">
                    {appointments.length}
                  </p>
                  <p className="text-stone-600 font-light">Total Appointments</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-light text-emerald-600 mb-2">
                    {appointments.filter(a => a.status.toLowerCase() === 'confirmed').length}
                  </p>
                  <p className="text-stone-600 font-light">Confirmed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-light text-stone-600 mb-2">
                    {appointments.filter(a => a.status.toLowerCase() === 'completed').length}
                  </p>
                  <p className="text-stone-600 font-light">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-light text-red-600 mb-2">
                    {appointments.filter(a => a.urgency.toLowerCase() === 'high').length}
                  </p>
                  <p className="text-stone-600 font-light">High Priority</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}