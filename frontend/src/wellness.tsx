import { useState, useEffect } from 'react';
import Navbar from './nav';
import ReactMarkdown from 'react-markdown';
// If you want to use markdown rendering for AI insights, ensure you use ReactMarkdown in your JSX:
// <ReactMarkdown>{aiInsights}</ReactMarkdown>
import { logWellnessData, fetchWellnessData, getWellnessInsights, deleteWellnessData } from './services/flaskService';

interface WellnessData {
  sleep: number;
  steps: number;
  water: number;
  mood: string;
  exercise: string;
  date: string;
}

interface WeeklySummary {
  avgSleep: number;
  totalSteps: number;
  avgWater: number;
  mostCommonMood: string;
  exerciseDays: number;
}

const Wellness = () => {
  // Helper function to get local date string
  const getLocalDateString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  };

  const [todayData, setTodayData] = useState<WellnessData>({
    sleep: 0,
    steps: 0,
    water: 0,
    mood: '',
    exercise: '',
    date: getLocalDateString()
  });

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({
    avgSleep: 0,
    totalSteps: 0,
    avgWater: 0,
    mostCommonMood: 'No data',
    exerciseDays: 0
  });

  const [wellnessHistory, setWellnessHistory] = useState<WellnessData[]>([]);
  const [individualLogs, setIndividualLogs] = useState<WellnessData[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<WellnessData | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [searchDate, setSearchDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination helper functions
  const getFilteredData = () => {
    let filteredData = [...wellnessHistory];
    
    // Filter by search date if provided
    if (searchDate) {
      filteredData = filteredData.filter(log => log.date === searchDate);
    }
    
    return filteredData.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
  };

  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredData().length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchDateChange = (date: string) => {
    setSearchDate(date);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const clearSearch = () => {
    setSearchDate('');
    setCurrentPage(1);
  };

  // Load data for a specific date when user selects a date to log
  const loadDataForDate = (selectedDate: string) => {
    const existingLog = wellnessHistory.find(log => log.date === selectedDate);
    if (existingLog) {
      setTodayData({
        ...existingLog,
        water: existingLog.water || 0,
        sleep: existingLog.sleep || 0,
        steps: existingLog.steps || 0,
        mood: existingLog.mood || '',
        exercise: existingLog.exercise || '',
        date: selectedDate
      });
    } else {
      // Reset form for new date
      setTodayData({
        sleep: 0,
        steps: 0,
        water: 0,
        mood: '',
        exercise: '',
        date: selectedDate
      });
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, insightsLoaded:', insightsLoaded);
    let isEffectActive = true; // Flag to prevent race conditions
    
    const loadInitialData = async () => {
      console.log('loadInitialData called');
      
      // Only proceed if this effect is still active and insights haven't been loaded
      if (!isEffectActive || insightsLoaded) {
        console.log('Effect cancelled or insights already loaded');
        return;
      }
      
      // Set loading state immediately before any data loading
      setIsLoadingInsights(true);
      
      await loadWellnessData();
      
      // Double-check before loading insights (React Strict Mode protection)
      if (isEffectActive && !insightsLoaded) {
        console.log('Loading insights for the first time');
        await loadAiInsights('useEffect-initial');
        if (isEffectActive) {
          setInsightsLoaded(true);
        }
      }
    };
    
    loadInitialData();
    
    // Cleanup function to cancel the effect if component unmounts or re-runs
    return () => {
      isEffectActive = false;
    };
  }, [insightsLoaded]); // Include insightsLoaded to prevent duplicate loads

  const handleQuickLog = (type: string, value: number | string) => {
    setTodayData(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const loadWellnessData = async () => {
    try {
      // Fetch wellness data from ICP backend
      const wellnessResponse = await fetchWellnessData('user123', 30); // Get 30 days of data
      console.log('Fetched wellness response:', wellnessResponse);
      
      if (wellnessResponse.logs && wellnessResponse.logs.length > 0) {
        // Parse wellness logs - handle both regular keys and numeric keys from Motoko serialization
        const parsedLogs = wellnessResponse.logs.map((log: any) => {
          console.log('Raw wellness log:', log); // Debug logging
          
          // Extract values from ICP numeric keys - corrected mapping based on actual data
          let date = log.date || log["1_113_806_382"] || getLocalDateString();
          let sleep = log.sleep || log["2_126_822_679"] || 0;
          let water = log.water_intake || log["1_152_427_284"] || 0;
          let exercise = log.exercise || log["1_450_210_392"] || 'Not logged'; // Fixed: was 1_214_307_575
          let mood = log.mood || log["1_214_307_575"] || 'Unknown'; // Fixed: was 1_450_210_392
          let steps = log.steps || log["2_215_541_671"] || 0;
          
          console.log('Extracted values - sleep raw:', log["2_126_822_679"], 'sleep final:', sleep);
          console.log('Extracted values - water raw:', log["1_152_427_284"], 'water final:', water);
          
          // Handle null values properly
          if (sleep === null) sleep = 0;
          if (water === null) water = 0;
          if (steps === null) steps = 0;
          if (mood === null) mood = 'Unknown';
          if (exercise === null) exercise = 'Not logged';
          
          const parsedLog = {
            sleep: typeof sleep === 'number' ? sleep : (parseFloat(sleep) || 0),
            steps: typeof steps === 'number' ? steps : (parseInt(steps) || 0),
            water: typeof water === 'number' ? water : (parseFloat(water) || 0),
            mood: String(mood),
            exercise: String(exercise),
            date: String(date)
          };
          
          console.log('Final parsed log with water value:', parsedLog.water); // Debug logging
          
          console.log('Parsed wellness log:', parsedLog); // Debug logging
          return parsedLog;
        });
        
        // Group entries by date and aggregate values for each date
        const groupedByDate: Record<string, WellnessData> = {};
        
        parsedLogs.forEach((log: WellnessData) => {
          const dateKey = log.date;
          
          if (!groupedByDate[dateKey]) {
            // First entry for this date
            groupedByDate[dateKey] = { ...log };
          } else {
            // Aggregate with existing entry for this date
            const existing = groupedByDate[dateKey];
            groupedByDate[dateKey] = {
              date: dateKey,
              // Take the highest/latest values, or sum where appropriate
              sleep: Math.max(existing.sleep, log.sleep),
              steps: existing.steps + log.steps, // Sum steps throughout the day
              water: existing.water + log.water, // Sum water throughout the day
              mood: log.mood !== 'Unknown' ? log.mood : existing.mood, // Take non-default mood
              exercise: log.exercise !== 'Not logged' ? log.exercise : existing.exercise // Take non-default exercise
            };
          }
        });
        
        // Convert grouped data back to array and sort by date
        const aggregatedLogs = Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
        
        console.log('Grouped wellness logs by date:', aggregatedLogs);
        
        setWellnessHistory(aggregatedLogs);
        
        // Keep original individual logs for Recent Activity Overview
        const individualLogs = parsedLogs.sort((a, b) => a.date.localeCompare(b.date));
        setIndividualLogs(individualLogs);
        
        // Reset to first page when new data is loaded
        setCurrentPage(1);
        
        // Calculate weekly summary from aggregated data based on last 7 calendar days
        if (aggregatedLogs.length > 0) {
          // Get last 7 calendar days (not just last 7 logs) - using local time date strings
          const todayDate = new Date();
          const today = todayDate.getFullYear() + '-' + 
                       String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(todayDate.getDate()).padStart(2, '0');
          
          const sevenDaysAgoDate = new Date();
          sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
          const sevenDaysAgoStr = sevenDaysAgoDate.getFullYear() + '-' + 
                                 String(sevenDaysAgoDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                 String(sevenDaysAgoDate.getDate()).padStart(2, '0');
          
          const recentLogs = aggregatedLogs.filter((log: WellnessData) => {
            const logDateStr = log.date;
            const isInRange = logDateStr >= sevenDaysAgoStr && logDateStr <= today;
            console.log(`Date filter: ${logDateStr}, Range: ${sevenDaysAgoStr} to ${today}, Included: ${isInRange}`);
            console.log(`Aggregated log sleep value: ${log.sleep}, water: ${log.water}`);
            return isInRange;
          });
          
          console.log('Recent aggregated logs after filtering:', recentLogs);
          
          const totalSleep = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.sleep, 0);
          const totalSteps = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.steps, 0);
          const totalWater = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.water, 0);
          const exerciseDays = recentLogs.filter((log: WellnessData) => log.exercise && log.exercise !== 'Not logged').length;
          
          console.log('Calculated totals from aggregated data - Sleep:', totalSleep, 'Steps:', totalSteps, 'Water:', totalWater);
          
          // Calculate averages based on actual days with data, not empty days
          const daysWithSleepData = recentLogs.filter((log: WellnessData) => log.sleep > 0).length;
          const daysWithWaterData = recentLogs.filter((log: WellnessData) => log.water > 0).length;
          
          console.log('Days with sleep data:', daysWithSleepData, 'Days with water data:', daysWithWaterData);
          
          // Find most common mood
          const moodCounts: Record<string, number> = {};
          recentLogs.forEach((log: WellnessData) => {
            if (log.mood && log.mood !== 'Unknown') {
              moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
            }
          });
          const mostCommonMood = Object.keys(moodCounts).length > 0 
            ? Object.keys(moodCounts).reduce((a, b) => 
                moodCounts[a] > moodCounts[b] ? a : b
              ) 
            : 'No data';
          
          const calculatedSummary = {
            avgSleep: daysWithSleepData > 0 ? totalSleep / daysWithSleepData : 0, // Average over days with sleep data
            totalSteps: totalSteps,
            avgWater: daysWithWaterData > 0 ? totalWater / daysWithWaterData : 0, // Average over days with water data
            mostCommonMood: mostCommonMood,
            exerciseDays: exerciseDays
          };
          
          console.log('Final weekly summary:', calculatedSummary);
          setWeeklySummary(calculatedSummary);
          
          // Set today's data if available
          const todayLog = parsedLogs.find((log: WellnessData) => log.date === getLocalDateString());
          if (todayLog) {
            setTodayData(todayLog);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading wellness data from backend:', error);
      // Keep default/empty state if backend is unavailable
      setWellnessHistory([]);
      setIndividualLogs([]);
    }
  };

  const loadAiInsights = async (caller = 'unknown') => {
    console.log(`🔄 loadAiInsights called by: ${caller}`);
    
    // Prevent duplicate calls if already loading
    if (isLoadingInsights) {
      console.log('AI insights already loading, skipping duplicate call from:', caller);
      return;
    }
    
    setIsLoadingInsights(true);
    setInsightsError('');
    
    try {
      console.log('Loading AI wellness insights for last 7 calendar days...');
      // Generate unique request ID for this call
      const requestId = Date.now().toString();
      setCurrentRequestId(requestId);
      
      // Always request insights for the last 7 calendar days
      const insightsData = await getWellnessInsights('user123', 7);
      
      // Only process the response if this is still the current request
      if (currentRequestId === null || currentRequestId === requestId) {
        if (insightsData.success) {
          setAiInsights(insightsData.insights);
          console.log('AI insights loaded successfully:', insightsData.summary);
        } else {
          setInsightsError(insightsData.message);
          setAiInsights(insightsData.insights); // This might contain a fallback message
        }
      } else {
        console.log('Ignoring outdated response for request:', requestId);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setInsightsError('Failed to load AI insights');
      setAiInsights('Unable to load AI insights at the moment. Please try again later.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleSaveData = async () => {
    setIsLogging(true);
    
    try {
      // Check if there's already data for today and merge it
      const existingTodayLog = wellnessHistory.find(log => log.date === todayData.date);
      
      let dataToSave = todayData;
      if (existingTodayLog) {
        // Merge with existing data - only update fields that are actually different from existing values
        dataToSave = {
          ...existingTodayLog,
          sleep: (todayData.sleep > 0 && todayData.sleep !== existingTodayLog.sleep) ? todayData.sleep : existingTodayLog.sleep,
          steps: (todayData.steps > 0 && todayData.steps !== existingTodayLog.steps) ? todayData.steps : existingTodayLog.steps,
          water: (todayData.water > 0 && todayData.water !== existingTodayLog.water) ? todayData.water : existingTodayLog.water,
          mood: (todayData.mood && todayData.mood !== '' && todayData.mood !== existingTodayLog.mood) ? todayData.mood : existingTodayLog.mood,
          exercise: (todayData.exercise && todayData.exercise !== '' && todayData.exercise !== existingTodayLog.exercise) ? todayData.exercise : existingTodayLog.exercise,
          date: todayData.date
        };
        console.log('Merging with existing today log:', existingTodayLog, 'Result:', dataToSave);
      }
      
      // Call wellness service to save data to ICP
      const data = await logWellnessData(dataToSave, 'user123');
      console.log('Wellness data logged successfully:', data);
      
      // Show success message
      alert('Wellness data saved to blockchain successfully!');
      
      // Refresh the data and AI insights after successful save
      setTimeout(async () => {
        await loadWellnessData();
        // Only reload insights if they were previously loaded
        if (insightsLoaded) {
          await loadAiInsights('after-save');
        }
      }, 1000); // Wait 1 second for the data to be fully stored
      
    } catch (error) {
      console.error('Error logging wellness data:', error);
      alert('Failed to save wellness data. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteData = async () => {
    if (!todayData.date) {
      alert('Please select a date to delete.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete wellness data for ${todayData.date}? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deleteWellnessData(todayData.date, 'user123');
      console.log('Wellness data deleted successfully:', result);
      
      // Clear the form data for the deleted date
      setTodayData({
        sleep: 0,
        steps: 0,
        water: 0,
        mood: '',
        exercise: '',
        date: todayData.date
      });
      
      // Refresh the data to reflect the deletion
      await loadInitialData();
      
      alert(`Wellness data for ${todayData.date} has been deleted successfully.`);
      
    } catch (error) {
      console.error('Error deleting wellness data:', error);
      alert('Failed to delete wellness data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const log = wellnessHistory.find(log => log.date === date);
    if (log) {
      setSelectedLog(log);
    } else {
      // Create empty log for selected date
      setSelectedLog({
        sleep: 0,
        steps: 0,
        water: 0,
        mood: '',
        exercise: '',
        date: date
      });
    }
    setShowDateModal(true);
  };

  const closeDateModal = () => {
    setShowDateModal(false);
    setSelectedLog(null);
    setSelectedDate('');
  };

  const moodOptions: Record<string, { color: string }> = {
    'Excellent': { color: 'bg-emerald-100 border-emerald-200 text-emerald-800' },
    'Good': { color: 'bg-blue-100 border-blue-200 text-blue-800' },
    'Okay': { color: 'bg-gray-100 border-gray-200 text-gray-800' },
    'Tired': { color: 'bg-purple-100 border-purple-200 text-purple-800' },
    'Stressed': { color: 'bg-orange-100 border-orange-200 text-orange-800' },
    'Sad': { color: 'bg-red-100 border-red-200 text-red-800' }
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
                Wellness Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-500 font-light">Last 7 days</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.avgSleep.toFixed(1)}h
              </h3>
              <p className="text-stone-500 font-light">Avg Sleep</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-500 font-light">This week</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.totalSteps.toLocaleString()}
              </h3>
              <p className="text-stone-500 font-light">Total Steps</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-500 font-light">Daily avg</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.avgWater.toFixed(1)} cups
              </h3>
              <p className="text-stone-500 font-light">Water Intake</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-500 font-light">This week</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.exerciseDays}/7
              </h3>
              <p className="text-stone-500 font-light">Exercise Days</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wellness Logging */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-light text-stone-800 font-serif">
                      Wellness Log
                    </h2>
                    <p className="text-stone-500 font-light mt-1">
                      {new Date(todayData.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  {/* Date Selector */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={todayData.date}
                        onChange={(e) => loadDataForDate(e.target.value)}
                        max={getLocalDateString()}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light text-sm"
                      />
                    </div>
                    <button
                      onClick={() => loadDataForDate(getLocalDateString())}
                      className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200 font-light text-sm"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Sleep */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <label className="block text-stone-700 font-light text-lg">
                      Sleep Hours
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={todayData.sleep || ''}
                      onChange={(e) => handleQuickLog('sleep', parseFloat(e.target.value) || 0)}
                      className="w-24 px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="8.0"
                    />
                    <span className="text-stone-500 font-light">hours</span>
                    <div className="flex space-x-2 ml-4">
                      {[6, 7, 8, 9].map(hours => (
                        <button
                          key={hours}
                          onClick={() => handleQuickLog('sleep', hours)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 font-light ${
                            todayData.sleep === hours
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <label className="block text-stone-700 font-light text-lg">
                      Steps Walked
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      value={todayData.steps || ''}
                      onChange={(e) => handleQuickLog('steps', parseInt(e.target.value) || 0)}
                      className="w-32 px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="5000"
                    />
                    <span className="text-stone-500 font-light">steps</span>
                    <div className="flex space-x-2 ml-4">
                      {[3000, 5000, 8000, 10000].map(steps => (
                        <button
                          key={steps}
                          onClick={() => handleQuickLog('steps', steps)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 font-light ${
                            todayData.steps === steps
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {steps.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Water */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <label className="block text-stone-700 font-light text-lg">
                      Water Intake
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={todayData.water || ''}
                      onChange={(e) => handleQuickLog('water', parseFloat(e.target.value) || 0)}
                      className="w-24 px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
                      placeholder="8"
                    />
                    <span className="text-stone-500 font-light">cups</span>
                    <div className="flex space-x-2 ml-4">
                      {[1, 2, 4, 8].map(glasses => (
                        <button
                          key={glasses}
                          onClick={() => handleQuickLog('water', todayData.water + glasses)}
                          className="px-3 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 font-light"
                        >
                          +{glasses}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <label className="block text-stone-700 font-light text-lg">
                      How are you feeling?
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(moodOptions).map(([mood, config]) => (
                      <button
                        key={mood}
                        onClick={() => handleQuickLog('mood', mood)}
                        className={`p-4 rounded-lg border transition-all duration-200 font-light ${
                          todayData.mood === mood
                            ? `${config.color} border-current`
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{mood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <label className="block text-stone-700 font-light text-lg">
                      Exercise Activity
                    </label>
                  </div>
                  <textarea
                    value={todayData.exercise}
                    onChange={(e) => handleQuickLog('exercise', e.target.value)}
                    placeholder="e.g., 30 minutes yoga, ran 3 miles, gym workout..."
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 font-light placeholder:opacity-50"
                    rows={3}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Walking', 'Running', 'Gym workout', 'Yoga', 'Swimming', 'Cycling'].map(activity => (
                      <button
                        key={activity}
                        onClick={() => handleQuickLog('exercise', activity)}
                        className="px-3 py-1 text-sm rounded-lg bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200 font-light"
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveData}
                    disabled={isLogging}
                    className="w-full py-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLogging ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Logging to Wellness Agent...
                      </span>
                    ) : (
                      'Save Wellness Data'
                    )}
                  </button>
                  
                  {/* Delete Button - Only show if date has existing data */}
                  {wellnessHistory.some(log => log.date === todayData.date) && (
                    <button
                      onClick={handleDeleteData}
                      disabled={isDeleting}
                      className="w-full mt-3 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </span>
                      ) : (
                        '🗑️ Delete Data for This Date'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AI Wellness Insights */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-light text-stone-800 font-serif">
                    AI Wellness Insights
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-stone-500 font-light">Powered by ASI1</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {isLoadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-stone-500 font-light">Analyzing your wellness data...</p>
                    <p className="text-xs text-stone-400 mt-1">This may take a few moments</p>
                  </div>
                ) : insightsError ? (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-red-800">Unable to Load Insights</h4>
                    </div>
                    <p className="text-sm text-red-600 font-light leading-relaxed mb-3">
                      {insightsError}
                    </p>
                    <button
                      onClick={() => loadAiInsights('try-again-button')}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors duration-200 font-light"
                    >
                      Try Again
                    </button>
                  </div>
                ) : aiInsights ? (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-stone-800">Personalized Wellness Analysis</h4>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm text-stone-700 font-light leading-relaxed whitespace-pre-line">
                        <ReactMarkdown>{aiInsights}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-xs text-stone-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 border border-stone-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-stone-600">No Insights Available</h4>
                    </div>
                    <p className="text-sm text-stone-500 font-light leading-relaxed mb-3">
                      Start logging your daily wellness activities to receive personalized AI insights about your health patterns and recommendations for improvement.
                    </p>
                    <button
                      onClick={() => loadAiInsights('generate-insights-button')}
                      className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200 transition-colors duration-200 font-light"
                    >
                      Generate Insights
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complete Wellness Data Overview */}
          {wellnessHistory.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-light text-stone-800 font-serif">
                    Complete Wellness Data
                  </h3>
                  
                  {/* Date Search */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => handleSearchDateChange(e.target.value)}
                        max={getLocalDateString()}
                        className="px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light text-sm"
                        placeholder="Search by date"
                      />
                    </div>
                    {searchDate && (
                      <button
                        onClick={clearSearch}
                        className="px-3 py-2 text-sm font-light text-stone-600 hover:text-stone-800 transition-colors duration-200"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => handleSearchDateChange(getLocalDateString())}
                      className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200 font-light text-sm"
                    >
                      Today
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-stone-500 font-light">
                    {searchDate ? (
                      <>Showing data for {new Date(searchDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} ({getFilteredData().length} {getFilteredData().length === 1 ? 'entry' : 'entries'})</>
                    ) : (
                      <>All your wellness data grouped by day ({wellnessHistory.length} unique days)</>
                    )}
                  </p>
                  {getTotalPages() > 1 && (
                    <div className="text-sm text-stone-500 font-light">
                      Page {currentPage} of {getTotalPages()}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-stone-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-light text-stone-800">
                      {wellnessHistory.filter(log => log.sleep > 0).length}
                    </div>
                    <div className="text-xs text-stone-500">Days with Sleep Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-stone-800">
                      {wellnessHistory.filter(log => log.steps > 0).length}
                    </div>
                    <div className="text-xs text-stone-500">Days with Steps Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-stone-800">
                      {wellnessHistory.filter(log => log.water > 0).length}
                    </div>
                    <div className="text-xs text-stone-500">Days with Water Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-stone-800">
                      {wellnessHistory.filter(log => log.mood && log.mood !== 'Unknown').length}
                    </div>
                    <div className="text-xs text-stone-500">Days with Mood Data</div>
                  </div>
                </div>

                {/* Complete Data Table */}
                {getFilteredData().length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200">
                          <th className="text-left py-3 px-2 font-medium text-stone-700">Date</th>
                          <th className="text-center py-3 px-2 font-medium text-stone-700">Sleep</th>
                          <th className="text-center py-3 px-2 font-medium text-stone-700">Steps</th>
                          <th className="text-center py-3 px-2 font-medium text-stone-700">Water</th>
                          <th className="text-center py-3 px-2 font-medium text-stone-700">Mood</th>
                          <th className="text-left py-3 px-2 font-medium text-stone-700">Exercise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedData().map((log, index) => (
                        <tr key={index} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="py-3 px-2">
                            <div className="font-medium text-stone-800">
                              {new Date(log.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-stone-500">
                              {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            {log.sleep > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {log.sleep}h
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            {log.steps > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                                {log.steps.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            {log.water > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">
                                {log.water} cups
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            {log.mood && log.mood !== 'Unknown' ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                moodOptions[log.mood] ? moodOptions[log.mood].color : 'bg-stone-100 text-stone-600'
                              }`}>
                                {log.mood}
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {log.exercise && log.exercise !== 'Not logged' ? (
                              <div className="max-w-xs">
                                <p className="text-stone-700 truncate">{log.exercise}</p>
                              </div>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-light text-stone-800 mb-2">No wellness data found</h3>
                    <p className="text-stone-500 font-light mb-4">
                      {searchDate ? (
                        <>No wellness data was logged for {new Date(searchDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}.</>
                      ) : (
                        <>Start logging your wellness data to see it here.</>
                      )}
                    </p>
                    {searchDate && (
                      <button
                        onClick={clearSearch}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200 font-light text-sm"
                      >
                        Show All Data
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {getTotalPages() > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-stone-500 font-light">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredData().length)} to {Math.min(currentPage * itemsPerPage, getFilteredData().length)} of {getFilteredData().length} days
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-light rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-light rounded-lg transition-colors duration-200 ${
                              currentPage === page
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-2 text-sm font-light rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Recent Wellness Logs (Individual Entries) */}
          {individualLogs.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <h3 className="text-xl font-light text-stone-800 font-serif">
                  Recent Activity Log
                </h3>
                <p className="text-stone-500 font-light mt-1">
                  Individual wellness entries as they were logged ({individualLogs.length} total entries)
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {individualLogs.slice().reverse().slice(0, 15).map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium text-stone-800">
                            {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-stone-500">
                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          {/* Show what was logged in this specific entry */}
                          {log.sleep > 0 && (
                            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className="text-stone-700 font-medium">Sleep: {log.sleep}h</span>
                            </div>
                          )}
                          
                          {log.steps > 0 && (
                            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-stone-700 font-medium">Steps: {log.steps.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {log.water > 0 && (
                            <div className="flex items-center space-x-2 bg-cyan-50 px-3 py-1 rounded-full">
                              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="text-stone-700 font-medium">Water: {log.water} cups</span>
                            </div>
                          )}
                          
                          {log.mood && log.mood !== 'Unknown' && (
                            <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                              <div className={`w-3 h-3 rounded-full ${
                                moodOptions[log.mood] ? moodOptions[log.mood].color.split(' ')[0] : 'bg-stone-300'
                              }`}></div>
                              <span className="text-stone-700 font-medium">Mood: {log.mood}</span>
                            </div>
                          )}
                          
                          {log.exercise && log.exercise !== 'Not logged' && (
                            <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-stone-700 font-medium">Exercise: {log.exercise}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Log Modal */}
      {showDateModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-stone-800 font-serif">
                  Wellness Log
                </h2>
                <button
                  onClick={closeDateModal}
                  className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center hover:bg-stone-200 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-stone-500 font-light mt-1">
                {new Date(selectedLog.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sleep */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-800 font-medium">Sleep</p>
                    <p className="text-stone-500 text-sm">Hours of sleep</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-light text-stone-800">
                    {selectedLog.sleep > 0 ? `${selectedLog.sleep}h` : 'Not logged'}
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-800 font-medium">Steps</p>
                    <p className="text-stone-500 text-sm">Daily activity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-light text-stone-800">
                    {selectedLog.steps > 0 ? selectedLog.steps.toLocaleString() : 'Not logged'}
                  </p>
                </div>
              </div>

              {/* Water */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-800 font-medium">Water</p>
                    <p className="text-stone-500 text-sm">Hydration intake</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-light text-stone-800">
                    {selectedLog.water > 0 ? `${selectedLog.water} cups` : 'Not logged'}
                  </p>
                </div>
              </div>

              {/* Mood */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-stone-800 font-medium">Mood</p>
                    <p className="text-stone-500 text-sm">How you felt</p>
                  </div>
                </div>
                <div className="text-right">
                  {selectedLog.mood && selectedLog.mood !== 'Unknown' ? (
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        moodOptions[selectedLog.mood] ? moodOptions[selectedLog.mood].color.split(' ')[0] : 'bg-stone-300'
                      }`}></div>
                      <p className="text-lg font-light text-stone-800">{selectedLog.mood}</p>
                    </div>
                  ) : (
                    <p className="text-lg font-light text-stone-800">Not logged</p>
                  )}
                </div>
              </div>

              {/* Exercise */}
              {selectedLog.exercise && selectedLog.exercise !== 'Not logged' && (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-stone-800 font-medium">Exercise</p>
                      <p className="text-stone-500 text-sm">Physical activity</p>
                    </div>
                  </div>
                  <div className="ml-13 p-3 bg-stone-50 rounded-lg">
                    <p className="text-stone-700 font-light">{selectedLog.exercise}</p>
                  </div>
                </div>
              )}

              {/* No data message */}
              {(!selectedLog.sleep && !selectedLog.steps && !selectedLog.water && !selectedLog.mood && !selectedLog.exercise) && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-stone-600 font-light">No wellness data logged for this date</p>
                  <p className="text-stone-500 text-sm mt-1">Start tracking your daily activities to see insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wellness;