import { useState, useEffect } from 'react';
import Navbar from './nav';
import { logWellnessData, fetchWellnessData } from './services/flaskService';

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
  const [todayData, setTodayData] = useState<WellnessData>({
    sleep: 0,
    steps: 0,
    water: 0,
    mood: '',
    exercise: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({
    avgSleep: 0,
    totalSteps: 0,
    avgWater: 0,
    mostCommonMood: 'No data',
    exerciseDays: 0
  });

  const [wellnessHistory, setWellnessHistory] = useState<WellnessData[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    loadWellnessData();
  }, []);

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
          
          // Try to extract data from various possible key formats
          let date = log.date || log["1_113_806_382"] || new Date().toISOString().split('T')[0];
          let sleep = log.sleep || log["2_126_822_679"] || 0;
          let water = log.water_intake || log["1_152_427_284"] || 0;
          let mood = log.mood || log["1_450_210_392"] || 'Unknown';
          let exercise = log.exercise || log["1_214_307_575"] || 'Not logged';
          let steps = log.steps || log["2_215_541_671"] || 0;
          
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
          
          console.log('Parsed wellness log:', parsedLog); // Debug logging
          return parsedLog;
        });
        
        setWellnessHistory(parsedLogs);
        
        // Calculate weekly summary from real data
        if (parsedLogs.length > 0) {
          const recentLogs = parsedLogs.slice(-7); // Last 7 days of logs
          
          const totalSleep = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.sleep, 0);
          const totalSteps = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.steps, 0);
          const totalWater = recentLogs.reduce((sum: number, log: WellnessData) => sum + log.water, 0);
          const exerciseDays = recentLogs.filter((log: WellnessData) => log.exercise && log.exercise !== 'Not logged').length;
          
          // Count days with actual data for accurate averages
          const sleepDays = recentLogs.filter(log => log.sleep > 0).length;
          const waterDays = recentLogs.filter(log => log.water > 0).length;
          
          // Find most common mood
          const moodCounts: Record<string, number> = {};
          recentLogs.forEach((log: WellnessData) => {
            if (log.mood && log.mood !== 'Unknown') {
              moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
            }
          });
          const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b, 'Good'
          );
          
          setWeeklySummary({
            avgSleep: sleepDays > 0 ? totalSleep / sleepDays : 0, // Average over actual sleep days
            totalSteps: totalSteps,
            avgWater: waterDays > 0 ? totalWater / waterDays : 0, // Average over actual water days
            mostCommonMood: mostCommonMood,
            exerciseDays: exerciseDays
          });
          
          // Set today's data if available
          const todayLog = parsedLogs.find((log: WellnessData) => log.date === new Date().toISOString().split('T')[0]);
          if (todayLog) {
            setTodayData(todayLog);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading wellness data from backend:', error);
      // Keep default/empty state if backend is unavailable
    }
  };

  const handleSaveData = async () => {
    setIsLogging(true);
    
    try {
      // Call wellness service to save data to ICP
      const data = await logWellnessData(todayData, 'user123');
      console.log('Wellness data logged successfully:', data);
      
      // Show success message
      alert('Wellness data saved to blockchain successfully!');
      
      // Refresh the data after successful save
      setTimeout(() => {
        loadWellnessData();
      }, 1000); // Wait 1 second for the data to be fully stored
      
    } catch (error) {
      console.error('Error logging wellness data:', error);
      alert('Failed to save wellness data. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const moodOptions = {
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
            <h1 className="text-3xl font-light text-stone-800 tracking-wide font-serif">
              Wellness Dashboard
            </h1>
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
            {/* Today's Logging */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-2xl font-light text-stone-800 font-serif">
                  Today's Wellness Log
                </h2>
                <p className="text-stone-500 font-light mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* Sleep */}
                <div>
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    Sleep Hours
                  </label>
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
                          className="px-3 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors duration-200 font-light"
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    Steps Walked
                  </label>
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
                          className="px-3 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors duration-200 font-light"
                        >
                          {steps.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Water */}
                <div>
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    Water Intake
                  </label>
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
                    <span className="text-stone-500 font-light">glasses</span>
                    <div className="flex space-x-2 ml-4">
                      {[4, 6, 8, 10].map(glasses => (
                        <button
                          key={glasses}
                          onClick={() => handleQuickLog('water', glasses)}
                          className="px-3 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-cyan-100 hover:text-cyan-700 transition-colors duration-200 font-light"
                        >
                          {glasses} cups
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    How are you feeling?
                  </label>
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
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    Exercise Activity
                  </label>
                  <textarea
                    value={todayData.exercise}
                    onChange={(e) => handleQuickLog('exercise', e.target.value)}
                    placeholder="e.g., 30 minutes yoga, ran 3 miles, gym workout..."
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-200 focus:border-emerald-500 font-light placeholder:opacity-50"
                    rows={3}
                  />
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
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <h3 className="text-xl font-light text-stone-800 font-serif">
                  AI Wellness Insights
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-stone-800">Sleep Quality</h4>
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {weeklySummary.avgSleep > 0 ? (
                      weeklySummary.avgSleep >= 7 && weeklySummary.avgSleep <= 9 ?
                      `Excellent! Your ${weeklySummary.avgSleep.toFixed(1)}h average is in the optimal range for recovery and mental performance.` :
                      weeklySummary.avgSleep < 7 ?
                      `Your ${weeklySummary.avgSleep.toFixed(1)}h average could be improved. Aim for 7-8 hours for better wellness.` :
                      `Great sleep quality! ${weeklySummary.avgSleep.toFixed(1)}h shows you prioritize rest.`
                    ) : (
                      "Start tracking your sleep to get personalized insights on your rest patterns."
                    )}
                  </p>
                </div>
                
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-stone-800">Activity Level</h4>
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {weeklySummary.totalSteps > 0 ? (
                      weeklySummary.totalSteps >= 70000 ? // 10k steps * 7 days
                      `Outstanding! ${weeklySummary.totalSteps.toLocaleString()} steps this week shows excellent activity levels.` :
                      weeklySummary.totalSteps >= 35000 ? // 5k steps * 7 days
                      `Good progress with ${weeklySummary.totalSteps.toLocaleString()} steps. Try adding ${(70000 - weeklySummary.totalSteps).toLocaleString()} more to reach 10k daily.` :
                      `You're building momentum with ${weeklySummary.totalSteps.toLocaleString()} steps. Every step counts toward better health!`
                    ) : (
                      "Track your daily steps to see insights about your activity patterns and set achievable goals."
                    )}
                  </p>
                </div>
                
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-stone-800">Hydration</h4>
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {weeklySummary.avgWater > 0 ? (
                      weeklySummary.avgWater >= 8 ?
                      `Excellent hydration! Your ${weeklySummary.avgWater.toFixed(1)} glasses daily average supports optimal health.` :
                      weeklySummary.avgWater >= 6 ?
                      `Good hydration with ${weeklySummary.avgWater.toFixed(1)} glasses daily. Try to reach 8 glasses for optimal benefits.` :
                      `Your ${weeklySummary.avgWater.toFixed(1)} glass average is a start! Gradually increase to 8 glasses daily.`
                    ) : (
                      "Start logging your water intake to maintain proper hydration and support your overall wellness."
                    )}
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-stone-800">Exercise Progress</h4>
                  </div>
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {wellnessHistory.length > 0 ? (
                      weeklySummary.exerciseDays >= 5 ?
                      `Amazing consistency! You exercised ${weeklySummary.exerciseDays} out of 7 days this week.` :
                      weeklySummary.exerciseDays >= 3 ?
                      `Good effort with ${weeklySummary.exerciseDays}/7 exercise days. Try adding ${7 - weeklySummary.exerciseDays} more sessions!` :
                      weeklySummary.exerciseDays > 0 ?
                      `You're getting started with ${weeklySummary.exerciseDays} exercise day(s). Build the habit gradually!` :
                      "No exercise logged this week. Even 10 minutes of movement daily can make a big difference!"
                    ) : (
                      "Start logging your exercise activities to track your fitness journey and build healthy habits."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wellness History */}
          {wellnessHistory.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-100">
              <div className="p-6 border-b border-stone-100">
                <h3 className="text-xl font-light text-stone-800 font-serif">
                  Recent Wellness Logs
                </h3>
                <p className="text-stone-500 font-light mt-1">
                  Your wellness journey over the past {wellnessHistory.length} days
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {wellnessHistory.slice().reverse().map((log, index) => (
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
                          {log.sleep > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className="text-stone-600">{log.sleep}h</span>
                            </div>
                          )}
                          
                          {log.steps > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-stone-600">{log.steps.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {log.water > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="text-stone-600">{log.water} cups</span>
                            </div>
                          )}
                          
                          {log.mood && log.mood !== 'Unknown' && (
                            <div className="flex items-center space-x-1">
                              <div className={`w-3 h-3 rounded-full ${
                                moodOptions[log.mood] ? moodOptions[log.mood].color.split(' ')[0] : 'bg-stone-300'
                              }`}></div>
                              <span className="text-stone-600">{log.mood}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {log.exercise && log.exercise !== 'Not logged' && (
                        <div className="text-right max-w-xs">
                          <p className="text-xs text-stone-500 truncate">{log.exercise}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wellness;