import { useState, useEffect, type ReactElement } from 'react';
import Navbar from './nav';
import { fetchDoctors, fetchAppointments, cancelAppointment } from './services/flaskService';
import { useAuth } from './contexts/AuthContext';
import { Star } from 'lucide-react';

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

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed';
}

const Doctor = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { principal, isAuthenticated, isLoading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [cancellingAppointments, setCancellingAppointments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Move useEffect right after all useState hooks to comply with Rules of Hooks
  useEffect(() => {
    const loadData = async () => {
      try {
        const specialtyToFetch = selectedSpecialty === 'all' ? 'general' : selectedSpecialty.replace('-', ' ');
        
        // Use fallback user ID if principal is not available yet
        const userIdToUse = principal || 'development-user-fallback';
        
        // Fetch doctors and appointments separately to prevent one failure from blocking the other
        const [doctorsData, appointmentsData] = await Promise.allSettled([
          fetchDoctors(specialtyToFetch),
          fetchAppointments(userIdToUse)
        ]);
        
        const doctors = doctorsData.status === 'fulfilled' ? doctorsData.value : [];
        const appointments = appointmentsData.status === 'fulfilled' ? appointmentsData.value : [];
        
        console.log('Raw doctors data from backend:', doctors);
        console.log('Appointments fetch result:', appointmentsData);
        
        const parsedDoctors = doctors.map((doctor: any) => ({
          id: doctor["3_732_697_147"] || doctor.doctor_id || `doc_${Date.now()}_${Math.random()}`,
          name: doctor["1_224_700_491"] || doctor.name || 'Unknown Doctor',
          specialty: (doctor["2_069_078_014"] || doctor.specialty || 'General Practice').toLowerCase().replace(/\s+/g, '-'),
          rating: doctor["3_146_396_701"] || doctor.rating || 4.5,
          reviews: Math.floor(Math.random() * 200) + 50, // Generate reviews since not in backend
          experience: doctor["825_774_209"] || doctor.experience_years || 5,
          location: 'Medical Center', // Default location since not in backend
          availability: generateAvailabilityDates(doctor["2_213_151_757"] || doctor.available_days),
          price: Math.floor(Math.random() * 100) + 100, // Generate price since not in backend
          image: 'icon',
          bio: `Experienced ${doctor["2_069_078_014"] || doctor.specialty || 'general practice'} specialist with ${doctor["825_774_209"] || doctor.experience_years || 5}+ years of experience. ${doctor["1_692_858_852"] || doctor.qualifications || ''}.`,
          languages: ['English'], // Default since not in backend
          image_url: doctor["914_348_363"] || doctor.image_url || '',
          qualifications: doctor["1_692_858_852"] || doctor.qualifications || '',
          available_days: doctor["2_213_151_757"] || doctor.available_days || [],
          available_slots: doctor["2_467_954_303"] || doctor.available_slots || []
        }));
        
        // Parse ICP appointments data format
        const parsedAppointments = appointments.map((appointment: any) => ({
          id: appointment.appointment_id || appointment.id || `apt_${Date.now()}`,
          doctorId: appointment.doctor_id || appointment.doctorId,
          doctorName: appointment.doctor_name || appointment.doctorName || 'Unknown Doctor',
          specialty: appointment.specialty || 'general-practice',
          date: appointment.date || appointment.appointment_date,
          time: appointment.time || appointment.appointment_time,
          type: appointment.type || 'consultation',
          status: appointment.status || 'confirmed'  // Default to 'confirmed' to match backend
        }));
        
        setDoctors(parsedDoctors.length > 0 ? parsedDoctors : getDefaultDoctors());
        setAppointments(parsedAppointments); // Don't use fallback appointments - show empty state instead
        
      } catch (error) {
        console.error('Error loading data from backend:', error);
        // Fallback to default doctors but empty appointments if backend is unavailable
        setDoctors(getDefaultDoctors());
        setAppointments([]); // Show empty appointments instead of fake data
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedSpecialty, principal]);

  // Debug logging
  console.log('Doctor component auth state:', { isAuthenticated, principal, authLoading });

  const specialties = [
    'all', 'cardiology', 'dermatology', 'neurology', 'orthopedics', 
    'pediatrics', 'psychiatry', 'oncology', 'general-practitioner'
  ];

  const generateAvailabilityDates = (availableDays: string[]): string[] => {
    if (!availableDays || availableDays.length === 0) return ['2024-08-22', '2024-08-23', '2024-08-24'];
    
    const today = new Date();
    const dates: string[] = [];
    
    // Generate next 14 days and filter by available days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (availableDays.includes(dayName)) {
        dates.push(date.toISOString().split('T')[0]);
        if (dates.length >= 6) break; // Limit to 6 dates
      }
    }
    
    return dates.length > 0 ? dates : ['2024-08-22', '2024-08-23', '2024-08-24'];
  };


  const getDefaultDoctors = (): Doctor[] => [
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      specialty: 'cardiology',
      rating: 4.9,
      reviews: 127,
      experience: 12,
      location: 'Medical Center Downtown',
      availability: ['2024-08-22', '2024-08-23', '2024-08-26'],
      price: 150,
      image: '❤️',
      bio: 'Specialized in preventive cardiology and heart disease management.',
      languages: ['English', 'Mandarin'],
      image_url: '',
    },
    {
      id: '2',
      name: 'Dr. Michael Rodriguez',
      specialty: 'dermatology',
      rating: 4.8,
      reviews: 89,
      experience: 8,
      location: 'Skin Care Clinic',
      availability: ['2024-08-22', '2024-08-24', '2024-08-25'],
      price: 120,
      image: '🧴',
      bio: 'Expert in cosmetic dermatology and skin cancer prevention.',
      languages: ['English', 'Spanish'],
      image_url: ''
    }
  ];

  // useEffect moved above - removed duplicate

  const getSpecialtyIcon = (specialty: string) => {
    const iconMap: Record<string, ReactElement> = {
      'cardiology': (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      'dermatology': (
        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      'neurology': (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      'orthopedics': (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'pediatrics': (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 001.5-1.5V6a3 3 0 10-6 0v2.5A1.5 1.5 0 007.5 10H9z" />
        </svg>
      ),
      'psychiatry': (
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      'oncology': (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    };
    return iconMap[specialty.toLowerCase()] || (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };



  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });


  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };


  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingAppointments(prev => new Set(prev).add(appointmentId));
    
    try {
      const userIdToUse = principal || 'development-user-fallback';
      const result = await cancelAppointment(appointmentId, userIdToUse);
      
      if (result.success) {
        // Remove the cancelled appointment from the list
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        
        // Show success message (you can replace with a toast library)
        alert(`Appointment cancelled successfully!\n\nID: ${appointmentId}\nStatus: ${result.message}`);
      } else {
        // Show error message
        alert(`Failed to cancel appointment:\n${result.message}`);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error cancelling appointment. Please try again.');
    } finally {
      setCancellingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: Record<string, string> = {
      cardiology: 'bg-red-100 text-red-700 border-red-200',
      dermatology: 'bg-pink-100 text-pink-700 border-pink-200',
      neurology: 'bg-purple-100 text-purple-700 border-purple-200',
      orthopedics: 'bg-blue-100 text-blue-700 border-blue-200',
      pediatrics: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      psychiatry: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'general-practice': 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[specialty] || 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const formatSpecialty = (specialty: string) => {
    return specialty.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle conditional rendering after all hooks have been called
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !principal) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Please log in to access doctor bookings</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
              Find a Doctor
            </h1>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* My Appointments Section */}
          {appointments.filter(appointment => appointment.status !== 'cancelled').length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-light text-stone-800 font-serif mb-4">
                Upcoming Appointments
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {appointments.filter(appointment => appointment.status !== 'cancelled').map((appointment) => (
                  <div key={appointment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-stone-800">{appointment.doctorName}</h3>
                          <p className="text-sm text-stone-500 font-light">{formatSpecialty(appointment.specialty)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getSpecialtyColor(appointment.specialty)}`}>
                        {formatSpecialty(appointment.specialty)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-stone-600 space-x-4">
                        <span className="flex items-center">
                          📅 {new Date(appointment.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          🕒 {appointment.time}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-stone-500 font-mono bg-stone-50 px-2 py-1 rounded border">
                          ID: {appointment.id}
                        </div>
                        
                        {/* Show cancel button for confirmed and scheduled appointments */}
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancellingAppointments.has(appointment.id)}
                            className="px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingAppointments.has(appointment.id) ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search doctors by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 font-light text-lg placeholder:opacity-30"
                />
              </div>

              {/* Wrapper for custom dropdown */}
              <div className="relative">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="appearance-none px-6 py-4 pr-12 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light text-lg bg-white"
                >
                  <option value="all">All Specialties</option>
                  {specialties.slice(1).map(specialty => (
                    <option key={specialty} value={specialty}>
                      {formatSpecialty(specialty)}
                    </option>
                  ))}
                </select>
                
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-4 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-stone-500 font-light">Loading doctors from ICP blockchain...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Doctor Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100">
                        {doctor.image_url ? (
                          <img 
                            src={doctor.image_url} 
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to specialty icon if image fails
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const container = target.parentElement!;
                              container.innerHTML = '';
                              const iconWrapper = document.createElement('div');
                              iconWrapper.className = 'w-16 h-16 bg-stone-100 rounded-xl flex items-center justify-center';
                              container.appendChild(iconWrapper);
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-stone-100 rounded-xl flex items-center justify-center">
                            {getSpecialtyIcon(doctor.specialty)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-light text-stone-800 mb-1">{doctor.name}</h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getSpecialtyColor(doctor.specialty)}`}>
                          {formatSpecialty(doctor.specialty)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-amber-500 mb-1">
                        <span>
                          <Star width={15} className='mr-2'/>
                        </span>
                         {doctor.rating}
                        <span className="text-stone-400 font-light ml-1">({doctor.reviews})</span>
                      </div>
                      <p className="text-sm text-stone-500 font-light">{doctor.experience}+ years</p>
                    </div>
                  </div>

                  <p className="text-stone-600 font-light mb-4 leading-relaxed">{doctor.bio}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-stone-500 font-light mb-1">Location</p>
                      <p className="text-stone-700">{doctor.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500 font-light mb-1">Consultation</p>
                      <p className="text-stone-700">${doctor.price}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-stone-500 font-light mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.languages.map((language, index) => (
                        <span key={index} className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-light">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-stone-500 font-light mb-2">Next Available</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.availability.slice(0, 3).map((date, index) => (
                        <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-light border border-emerald-200">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleDoctorClick(doctor)}
                    className="cursor-pointer"
                  >
                    <div className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 text-center">
                      View Details
                    </div>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Doctor Details Modal */}
      {showDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-stone-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  Doctor Details
                </h2>
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100">
                  {selectedDoctor.image_url ? (
                    <img 
                      src={selectedDoctor.image_url} 
                      alt={selectedDoctor.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to specialty icon if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const container = target.parentElement!;
                        container.innerHTML = '';
                        const iconWrapper = document.createElement('div');
                        iconWrapper.className = 'w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center';
                        container.appendChild(iconWrapper);
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                      {getSpecialtyIcon(selectedDoctor.specialty)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-stone-800">{selectedDoctor.name}</h3>
                  <p className="text-sm text-stone-500 font-light">{formatSpecialty(selectedDoctor.specialty)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 font-light mb-2">Rating</p>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(selectedDoctor.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-stone-600 font-medium">({selectedDoctor.rating})</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-500 font-light mb-2">Consultation Fee</p>
                  <p className="text-xl font-semibold text-emerald-600">${selectedDoctor.price}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">About</h3>
                <p className="text-stone-600 font-light leading-relaxed">{selectedDoctor.bio}</p>
              </div>

              {/* Experience & Languages */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500 font-light mb-2">Experience</p>
                  <p className="text-stone-700 font-medium">{selectedDoctor.experience} years</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500 font-light mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoctor.languages.map((lang, index) => (
                      <span key={index} className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Available Days</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.available_days?.map((day: string, index: number) => (
                    <span key={index} className={`px-3 py-1 rounded-lg text-sm font-medium border ${getSpecialtyColor(selectedDoctor.specialty)}`}>
                      {day}
                    </span>
                  )) || (
                    <span className="text-stone-500 font-light text-sm">No availability information</span>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Available Time Slots</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDoctor.available_slots?.map((slot: string, index: number) => (
                    <div key={index} className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-center text-sm text-stone-600">
                      {slot}
                    </div>
                  )) || (
                    <span className="text-stone-500 font-light text-sm col-span-3 text-center">No time slots available</span>
                  )}
                </div>
              </div>

              {/* Specialty Badge */}
              <div className="bg-gradient-to-r from-emerald-50 to-stone-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium border-2 ${getSpecialtyColor(selectedDoctor.specialty)}`}>
                    {formatSpecialty(selectedDoctor.specialty)} Specialist
                  </span>
                  <div className="text-sm text-stone-600 font-light">
                    Professional healthcare services
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctor;