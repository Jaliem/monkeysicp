import { useState, useEffect } from 'react';
import Navbar from './nav';
import { fetchDoctors, fetchAppointments } from './services/flaskService';

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
  status: 'scheduled' | 'completed' | 'cancelled';
}

const Doctor = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'consultation' as const,
    symptoms: '',
    notes: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const specialtyToFetch = selectedSpecialty === 'all' ? 'general' : selectedSpecialty.replace('-', ' ');
        
        // Fetch doctors and appointments separately to prevent one failure from blocking the other
        const [doctorsData, appointmentsData] = await Promise.allSettled([
          fetchDoctors(specialtyToFetch),
          fetchAppointments()
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
          image: getSpecialtyEmoji((doctor["2_069_078_014"] || doctor.specialty || 'General Practice').toLowerCase()),
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
          status: appointment.status || 'scheduled'
        }));
        
        setDoctors(parsedDoctors.length > 0 ? parsedDoctors : getDefaultDoctors());
        setAppointments(parsedAppointments);
        
      } catch (error) {
        console.error('Error loading data from backend:', error);
        // Fallback to default data if backend is unavailable
        setDoctors(getDefaultDoctors());
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedSpecialty]);

  const getSpecialtyEmoji = (specialty: string) => {
    const emojiMap: Record<string, string> = {
      'cardiology': '❤️',
      'dermatology': '🧴',
      'neurology': '🧠',
      'orthopedics': '🦴',
      'pediatrics': '👶',
      'psychiatry': '🧘',
      'oncology': '🎗️',
      'general practitioner': '👨‍⚕️',
      'general-practice': '👨‍⚕️'
    };
    return emojiMap[specialty.toLowerCase()] || '👨‍⚕️';
  };



  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });


  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !bookingData.date || !bookingData.time) return;

    setIsBooking(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: bookingData.date,
      time: bookingData.time,
      type: bookingData.type,
      status: 'scheduled'
    };

    setAppointments(prev => [...prev, newAppointment]);
    setShowBookingModal(false);
    setBookingData({ date: '', time: '', type: 'consultation', symptoms: '', notes: '' });
    setIsBooking(false);
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
          {appointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-light text-stone-800 font-serif mb-4">
                Upcoming Appointments
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                          👨‍⚕️
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
                    
                    <div className="flex items-center text-stone-600 space-x-4">
                      <span className="flex items-center">
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        {appointment.time}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        appointment.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appointment.status}
                      </span>
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
                
                {/* MODIFICATION: Changed 'right-0' to 'right-2' to move the arrow left. */}
                {/* Also increased padding on the select element ('pr-12') to make room. */}
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
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <img 
                          src={doctor.image_url || doctor.image} 
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">${doctor.image}</div>`;
                          }}
                        />
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
                        ⭐ {doctor.rating}
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

                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  Book Appointment
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img 
                    src={selectedDoctor.image_url || selectedDoctor.image} 
                    alt={selectedDoctor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">${selectedDoctor.image}</div>`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-stone-800">{selectedDoctor.name}</h3>
                  <p className="text-sm text-stone-500 font-light">{formatSpecialty(selectedDoctor.specialty)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-stone-700 font-light mb-2">Select Date</label>
                <select
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                >
                  <option value="">Choose a date</option>
                  {selectedDoctor.availability.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-light mb-2">Select Time</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                >
                  <option value="">Choose a time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-light mb-2">Appointment Type</label>
                <select
                  value={bookingData.type}
                  onChange={(e) => setBookingData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-light mb-2">Symptoms/Reason</label>
                <textarea
                  value={bookingData.symptoms}
                  onChange={(e) => setBookingData(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Describe your symptoms or reason for visit..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-stone-700 font-light mb-2">Additional Notes</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                  rows={2}
                />
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600 font-light">Consultation Fee:</span>
                  <span className="font-medium text-stone-800">${selectedDoctor.price}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!bookingData.date || !bookingData.time || isBooking}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </span>
                  ) : (
                    'Confirm Booking'
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

export default Doctor;