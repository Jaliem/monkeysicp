import { useState, useEffect } from 'react';
import Navbar from './nav';
import { useAuth } from './contexts/AuthContext';
import { fetchWellnessData, fetchMedicationReminders, fetchAppointments, createMedicationReminder } from './services/flaskService';

interface MedicationReminder {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  frequency: string;
  status: 'pending' | 'taken' | 'missed';
}

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'today' | 'overdue';
}

const Reminder = () => {
  const { principal, isAuthenticated, isLoading: authLoading } = useAuth();
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [hasLoggedWellnessToday, setHasLoggedWellnessToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for adding new reminders
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medication: '',
    time: ''
  });

  // useEffect must come right after state hooks  
  useEffect(() => {
    if (isAuthenticated && principal) {
      fetchReminderData();
    }
  }, [isAuthenticated, principal]); // fetchReminderData is defined after this hook

  // Helper function to get today's date string
  const getTodayDateString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  };

  // Calculate wellness logging streak
  const calculateStreak = (logs: any[]) => {
    if (!logs.length) {
      setCurrentStreak(0);
      return;
    }

    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreakCount = 0;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Check if logged today
    const hasLoggedToday = sortedLogs.some(log => log.date === todayString);
    
    // Calculate current streak starting from today or yesterday
    let checkDate = new Date(today);
    if (!hasLoggedToday) {
      // If not logged today, start from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards from today/yesterday
    for (let i = 0; i < 365; i++) { // Max 365 days to prevent infinite loop
      const dateString = checkDate.toISOString().split('T')[0];
      const hasLogForDate = sortedLogs.some(log => log.date === dateString);
      
      if (hasLogForDate) {
        currentStreakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    setCurrentStreak(currentStreakCount);
  };

  // Check if user has logged wellness data today
  const checkWellnessStatus = async () => {
    if (!principal) {
      console.log('No principal available for wellness status check');
      setHasLoggedWellnessToday(false);
      setCurrentStreak(0);
      return;
    }

    try {
      const todayDate = getTodayDateString();
      const wellnessData = await fetchWellnessData(principal);
      
      if (wellnessData && wellnessData.logs && Array.isArray(wellnessData.logs)) {
        // Parse wellness logs similar to wellness.tsx
        const parsedLogs = wellnessData.logs.map((log: any) => {
          let date = log.date || log["1_113_806_382"] || getTodayDateString();
          return { ...log, date };
        });
        
        const todayLog = parsedLogs.find((log: any) => log.date === todayDate);
        setHasLoggedWellnessToday(!!todayLog);
        
        // Use persistent streak from backend if available, otherwise calculate
        if (wellnessData.streak) {
          setCurrentStreak(wellnessData.streak.current_streak || 0);
        } else {
          // Fallback to calculation if no backend streak data
          calculateStreak(parsedLogs);
        }
      }
    } catch (error) {
      console.error('Error checking wellness status:', error);
      setHasLoggedWellnessToday(false);
      setCurrentStreak(0);
    }
  };

  // Fetch all reminder data
  const fetchReminderData = async () => {
    if (!principal) {
      console.log('No principal available for fetching reminder data');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await checkWellnessStatus();
      
      // Fetch real medication reminders from backend
      try {
        console.log('Attempting to fetch medication reminders...');
        const medicationData = await fetchMedicationReminders(principal);
        console.log('Fetched medication reminders:', medicationData);
        
        // Handle backend response format - log the actual structure for debugging
        console.log('Raw medication data structure:', JSON.stringify(medicationData, null, 2));
        
        let remindersList = [];
        
        if (Array.isArray(medicationData)) {
          remindersList = medicationData;
        } else if (medicationData && medicationData.reminders && Array.isArray(medicationData.reminders)) {
          remindersList = medicationData.reminders;
        } else {
          console.log('Unexpected medication data format:', medicationData);
        }
        
        console.log('Extracted reminders list:', remindersList);
        
        if (remindersList.length > 0) {
          // Map backend data to frontend format - handle Candid numeric keys
          const mappedReminders = remindersList.map((reminder: any, index: number) => {
            console.log(`Processing reminder ${index}:`, reminder);
            
            // Candid key mapping for MedicationReminder
            const REMINDER_KEY_MAPPING = {
              '373_703_110': 'active',        // active: Bool
              '1_291_635_725': 'time',        // time: Text
              '1_779_848_746': 'created_at',  // created_at: Text  
              '1_869_947_023': 'user_id',     // user_id: Text
              '1_962_253_242': 'medicine'     // medicine: Text
            };
            
            // Convert numeric keys to readable format
            const convertedReminder: any = {};
            Object.keys(reminder).forEach(key => {
              const mappedKey = REMINDER_KEY_MAPPING[key as keyof typeof REMINDER_KEY_MAPPING];
              if (mappedKey) {
                convertedReminder[mappedKey] = reminder[key];
              } else {
                convertedReminder[key] = reminder[key]; // Keep unmapped keys as-is
              }
            });
            
            console.log(`Converted reminder ${index}:`, convertedReminder);
            
            const mapped = {
              id: convertedReminder.id || convertedReminder.reminder_id || `reminder_${index}`,
              medication: convertedReminder.medicine || convertedReminder.medication || convertedReminder.medicine_name || 'Unknown Medication',
              dosage: convertedReminder.dosage || convertedReminder.dose || 'As prescribed',
              time: convertedReminder.time || convertedReminder.reminder_time || 'As needed',
              frequency: convertedReminder.frequency || convertedReminder.repeat_frequency || 'Daily',
              status: convertedReminder.active === false ? 'missed' : 'pending'
            };
            
            console.log(`Mapped reminder ${index}:`, mapped);
            return mapped;
          });
          
          console.log('Final mapped reminders:', mappedReminders);
          setMedicationReminders(mappedReminders);
        } else {
          console.log('No medication reminders found, using empty array');
          setMedicationReminders([]);
        }
      } catch (error) {
        console.error('Error fetching medication reminders:', error);
        console.log('Falling back to empty medication reminders due to backend error');
        setMedicationReminders([]);
      }

      // Fetch real appointments from backend
      try {
        console.log('Attempting to fetch appointments...');
        const appointmentData = await fetchAppointments(principal);
        console.log('Fetched appointments:', appointmentData);
        
        if (Array.isArray(appointmentData)) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // Map backend data to frontend format and filter for upcoming appointments
          const mappedAppointments = appointmentData
            .map((appointment: any) => ({
              id: appointment.id || appointment.appointment_id || Math.random().toString(),
              doctor: appointment.doctor_name || appointment.doctor || 'Unknown Doctor',
              specialty: appointment.specialty || appointment.doctor_specialty || 'General',
              date: appointment.date || appointment.appointment_date || todayStr,
              time: appointment.time || appointment.appointment_time || '00:00',
              location: appointment.location || appointment.clinic_location || 'TBD',
              status: appointment.status || 'upcoming'
            }))
            .filter((appointment: any) => {
              // Only show upcoming appointments (today or future)
              const appointmentDate = new Date(appointment.date);
              return appointmentDate >= today;
            })
            .map((appointment: any) => {
              // Update status based on date
              const appointmentDate = new Date(appointment.date);
              const isToday = appointmentDate.toISOString().split('T')[0] === todayStr;
              return {
                ...appointment,
                status: isToday ? 'today' : 'upcoming'
              };
            });
          
          setUpcomingAppointments(mappedAppointments);
        } else {
          console.log('No appointments found, using empty array');
          setUpcomingAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        console.log('Falling back to empty appointments due to backend error');
        setUpcomingAppointments([]);
      }

    } catch (error) {
      console.error('Error fetching reminder data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMedicationTaken = (id: string) => {
    setMedicationReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, status: 'taken' } 
          : reminder
      )
    );
  };

  // Handle form submission for new medication reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReminder.medication || !newReminder.time) {
      alert('Please fill in all fields');
      return;
    }

    if (!principal) {
      alert('Please authenticate first');
      return;
    }

    try {
      const result = await createMedicationReminder(principal, newReminder.medication, newReminder.time);
      
      if (result.success) {
        // Add the new reminder to the list
        const newReminderItem: MedicationReminder = {
          id: Date.now().toString(),
          medication: newReminder.medication,
          dosage: 'As prescribed',
          time: newReminder.time,
          frequency: 'Daily',
          status: 'pending'
        };
        
        setMedicationReminders([...medicationReminders, newReminderItem]);
        
        // Reset form
        setNewReminder({ medication: '', time: '' });
        setShowReminderForm(false);
        
        alert('Medication reminder added successfully!');
      } else {
        alert('Failed to add medication reminder: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      alert('Error adding medication reminder');
    }
  };

  // Show loading or redirect if not authenticated - moved after all hooks
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
          <h2 className="text-2xl font-light text-stone-700 mb-4">Authentication Required</h2>
          <p className="text-stone-600 mb-6">Please log in to view your reminders.</p>
          <a href="/login" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-stone-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-stone-600">Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-tr from-stone-50 via-white to-emerald-50">
      <style>{`
        @keyframes glow {
          0% { text-shadow: 0 0 8px #ffb347, 0 0 16px #ffb347, 0 0 32px #ffb347; }
          50% { text-shadow: 0 0 24px #ffb347, 0 0 48px #ffb347, 0 0 96px #ffb347; }
          100% { text-shadow: 0 0 8px #ffb347, 0 0 16px #ffb347, 0 0 32px #ffb347; }
        }
        .animate-glow {
          animation: glow 2s infinite alternate;
        }
      `}</style>
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-serif font-light text-stone-800 mb-2">Reminders</h1>
                <p className="text-stone-600 font-light">Stay on top of your health routine</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Streak Display */}
                <div className="flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg">
                  <svg className="w-6 h-6 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <div className="text-center">
                    <div className="text-2xl font-bold animate-glow">
                      {currentStreak}
                    </div>
                    <div className="text-xs opacity-90 animate-glow">
                      day{currentStreak !== 1 ? 's' : ''} streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wellness Log Reminder */}
            {!hasLoggedWellnessToday && (
              <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-light mb-2">Log Your Wellness Data</h2>
                    <p className="text-emerald-100 mb-2">You haven't logged your wellness data for today yet.</p>
                    {currentStreak > 0 ? (
                      <p className="text-emerald-100 font-medium mb-4">
                        Don't break your {currentStreak}-day streak! Keep the momentum going! 🔥
                      </p>
                    ) : (
                      <p className="text-emerald-100 font-medium mb-4">
                        Start building your wellness streak today! 🌱
                      </p>
                    )}
                  </div>
                  <div className="text-emerald-200">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <a
                  href="/wellness"
                  className="inline-block bg-white text-emerald-600 px-6 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                >
                  Log Wellness Data
                </a>
              </div>
            )}

            {/* Medication Reminders */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <svg className="w-6 h-6 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span>Medication Reminders</span>
                {/* Add Medication Reminder Button (beside title) */}
                {!showReminderForm && (
                  <button
                    onClick={() => setShowReminderForm(true)}
                    className="ml-3 bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-colors shadow-lg"
                    title="Add Medication Reminder"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </h2>
              
              {medicationReminders.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No medication reminders set</p>
              ) : (
                <div className="space-y-4">
                  {medicationReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`border rounded-xl p-4 transition-all ${
                        reminder.status === 'taken' 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : reminder.status === 'missed'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-stone-800">{reminder.medication}</h3>
                          <p className="text-sm text-stone-600">{reminder.dosage} • {reminder.frequency}</p>
                          <p className="text-sm text-stone-500">Take at {reminder.time}</p>
                        </div>
                        <div className="flex items-center">
                          {reminder.status === 'taken' ? (
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                              ✓ Taken
                            </span>
                          ) : reminder.status === 'missed' ? (
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                              Missed
                            </span>
                          ) : (
                            <button
                              onClick={() => markMedicationTaken(reminder.id)}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                            >
                              Mark as Taken
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Reminder Button */}
              {/* Add New Reminder Button removed from here, now in header */}

              {/* Add Reminder Form */}
              {showReminderForm && (
                <div className="mt-6 bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                  <h3 className="text-lg font-medium text-stone-800 mb-4">Add New Medication Reminder</h3>
                  <form onSubmit={handleAddReminder} className="space-y-4">
                    <div>
                      <label htmlFor="medication" className="block text-sm font-medium text-stone-700 mb-2">
                        Medication Name
                      </label>
                      <input
                        id="medication"
                        type="text"
                        value={newReminder.medication}
                        onChange={(e) => setNewReminder({ ...newReminder, medication: e.target.value })}
                        placeholder="e.g., Aspirin, Vitamin D, Blood pressure pills"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-stone-700 mb-2">
                        Reminder Time / Schedule
                      </label>
                      <input
                        id="time"
                        type="text"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                        placeholder="e.g., 8:00 AM, After eating, Before bed, Every 6 hours"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-4 pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        Add Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReminderForm(false);
                          setNewReminder({ medication: '', time: '' });
                        }}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-light text-stone-800 mb-6 flex items-center">
                <svg className="w-6 h-6 text-emerald-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Appointments
              </h2>
              
              {upcomingAppointments.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No upcoming appointments</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`border rounded-xl p-4 transition-all ${
                        appointment.status === 'today'
                          ? 'bg-yellow-50 border-yellow-200'
                          : appointment.status === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-stone-800">{appointment.doctor}</h3>
                          <p className="text-sm text-stone-600">{appointment.specialty}</p>
                          <p className="text-sm text-stone-500 mt-1">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                          <p className="text-sm text-stone-500">{appointment.location}</p>
                        </div>
                        <div className="text-right">
                          {appointment.status === 'today' && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                              Today
                            </span>
                          )}
                          {appointment.status === 'overdue' && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              Overdue
                            </span>
                          )}
                          {appointment.status === 'upcoming' && (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-stone-200">
                <a
                  href="/doctor"
                  className="text-emerald-700 hover:text-purple-700 font-medium text-sm flex items-center"
                >
                  Book New Appointment
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-light text-stone-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <a
                href="/wellness"
                className="flex flex-col items-center p-4 border border-stone-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all"
              >
                <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-medium text-stone-700">Log Wellness</span>
              </a>
              
              <a
                href="/doctor"
                className="flex flex-col items-center p-4 border border-stone-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all"
              >
                <svg className="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-stone-700">Book Doctor</span>
              </a>
              
              <a
                href="/pharmacy"
                className="flex flex-col items-center p-4 border border-stone-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
              >
                <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="text-sm font-medium text-stone-700">Order Medicine</span>
              </a>
              
              <a
                href="/chat"
                className="flex flex-col items-center p-4 border border-stone-200 rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all"
              >
                <svg className="w-8 h-8 text-stone-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium text-stone-700">Ask AI</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminder;