import { useState, useEffect } from 'react';
import Navbar from './nav';
import { logWellnessData } from './services/flaskService';

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
    avgSleep: 7.2,
    totalSteps: 28400,
    avgWater: 6.8,
    mostCommonMood: 'Good',
    exerciseDays: 4
  });

  const [isLogging, setIsLogging] = useState(false);

  const handleQuickLog = (type: string, value: number | string) => {
    setTodayData(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSaveData = async () => {
    setIsLogging(true);
    
    try {
      // Call Flask backend wellness endpoint
      const data = await logWellnessData(todayData, 'frontend_user');
      console.log('Wellness data logged successfully:', data);
      
      // Show success message (you could add a toast notification here)
      alert('Wellness data logged successfully!');
      
    } catch (error) {
      console.error('Error logging wellness data:', error);
      alert('Failed to log wellness data. Please check if the Flask backend is running.');
    } finally {
      setIsLogging(false);
    }
  };

  const moodEmojis = {
    'Excellent': '😄',
    'Good': '😊',
    'Okay': '😐',
    'Tired': '😴',
    'Stressed': '😰',
    'Sad': '😢'
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
            <p className="text-stone-500 font-light mt-2">
              Track your daily wellness journey
            </p>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">😴</span>
                </div>
                <span className="text-sm text-stone-500 font-light">Last 7 days</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.avgSleep}h
              </h3>
              <p className="text-stone-500 font-light">Avg Sleep</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👟</span>
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
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💧</span>
                </div>
                <span className="text-sm text-stone-500 font-light">Daily avg</span>
              </div>
              <h3 className="text-2xl font-light text-stone-800 mb-1">
                {weeklySummary.avgWater} cups
              </h3>
              <p className="text-stone-500 font-light">Water Intake</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💪</span>
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
                    😴 Sleep Hours
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
                    👟 Steps Walked
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
                    💧 Water Intake
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
                    😊 How are you feeling?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(moodEmojis).map(([mood, emoji]) => (
                      <button
                        key={mood}
                        onClick={() => handleQuickLog('mood', mood)}
                        className={`p-4 rounded-lg border transition-all duration-200 font-light ${
                          todayData.mood === mood
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{emoji}</span>
                        <span className="text-sm">{mood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise */}
                <div>
                  <label className="block text-stone-700 font-light mb-3 text-lg">
                    💪 Exercise Activity
                  </label>
                  <textarea
                    value={todayData.exercise}
                    onChange={(e) => handleQuickLog('exercise', e.target.value)}
                    placeholder="e.g., 30 minutes yoga, ran 3 miles, gym workout..."
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light"
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
                  🤖 AI Wellness Insights
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <h4 className="font-medium text-emerald-800 mb-2">Sleep Quality</h4>
                  <p className="text-sm text-emerald-700 font-light leading-relaxed">
                    Your sleep average is great! Try to maintain 7-8 hours consistently for optimal wellness.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Activity Level</h4>
                  <p className="text-sm text-blue-700 font-light leading-relaxed">
                    You're doing well with daily movement. Consider adding 2000 more steps to reach the 10k goal.
                  </p>
                </div>
                
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                  <h4 className="font-medium text-cyan-800 mb-2">Hydration</h4>
                  <p className="text-sm text-cyan-700 font-light leading-relaxed">
                    Good hydration habits! Keep drinking water throughout the day for best results.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2">Weekly Goal</h4>
                  <p className="text-sm text-purple-700 font-light leading-relaxed">
                    You're 4/7 days with exercise this week. Try to add one more workout session!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wellness;