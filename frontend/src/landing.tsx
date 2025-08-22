import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, HeartPulse, Hourglass, Link2, LockKeyhole, MoreHorizontal, Send } from "lucide-react";
import { useState } from "react";

const CuraDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

const messages = [
  { id: 1, text: "I’ve had mild chest tightness today.", isUser: true },
  { id: 2, text: "Noted. Would you like advice or a doctor referral?", isUser: false },
  { id: 3, text: "Please also note, I completed a 30-minute walk earlier.", isUser: true },
  { id: 4, text: "Great job staying active. I’ll record that in your wellness log and adjust recommendations accordingly.", isUser: false }
];


  const handleSend = () => {
    if (inputValue.trim()) {
      setInputValue('');
    }
  };

  return (
    <div className="w-full h-full max-w-[500px] mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200 flex flex-col">
  {/* Header */}
  <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between rounded-t-2xl">
    <h3 className="text-white font-semibold text-sm">Cura</h3>
    <button className="text-white hover:bg-white/10 rounded-full p-1 transition-colors">
      <MoreHorizontal size={14} />
    </button>
  </div>

  <div className="flex-1 p-3 space-y-4 bg-stone-50 overflow-y-auto">
    {messages.map((msg) => (
      <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
        {!msg.isUser && <div className="flex-shrink-0 mr-2"><HeartPulse /></div>}
        <div
          className={`max-w-[75%] px-3 py-2 text-sm rounded-2xl ${
            msg.isUser
              ? 'bg-emerald-600 text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
          }`}
        >
          {msg.text}
        </div>
      </div>
    ))}
  </div>

  {/* Input (always at bottom) */}
  <div className="border-t border-stone-200 p-2 bg-white">
    <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your update..."
        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button
        onClick={handleSend}
        className={`p-2 rounded-full transition-colors ${
          inputValue.trim()
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-200 text-gray-400'
        }`}
        disabled={!inputValue.trim()}
      >
        <Send size={14} />
      </button>
    </div>
  </div>
</div>


  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');

  };

  return (
    <div className="min-h-screen flex flex-col font-serif bg-stone-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <div className="text-3xl font-light text-emerald-700 tracking-wide">Cura.</div>
        <nav>
          <button
            onClick={handleLogin}
            className="px-6 py-3 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}

      <section className="flex flex-col mt-20 mb-10 items-center text-center px-8 py-28 bg-gradient-to-b from-stone-50 via-white to-stone-50 relative overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-amber-300 rounded-full opacity-20"
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 bg-emerald-300 rounded-full opacity-30"
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-15"
          animate={{ x: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-7xl font-light text-stone-800 mb-8 leading-tight"
          >
            Your health companion,{" "}
            <span className="relative">
              <span className="text-emerald-600">anytime</span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-2 left-0 w-full h-1 bg-emerald-300 rounded-full opacity-60 origin-left"
              />
            </span>
            ,{" "}
            <span className="relative">
              <span className="text-blue-600">anywhere</span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute -bottom-2 left-0 w-full h-1 bg-blue-300 rounded-full opacity-60 origin-left"
              />
            </span>
            .
          </motion.h1>

          {/* <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-2xl text-stone-600 max-w-3xl mx-auto mb-6 font-light leading-relaxed"
          >
            The future of healthcare — always available, personalized, and confidential.
          </motion.p> */}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-stone-500 max-w-3xl mx-auto mb-12 font-light text-lg leading-relaxed"
          >
            Built on{" "}
            <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              Fetch.ai
            </span>{" "}
            and the{" "}
            <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
              Internet Computer (ICP)
            </span>
            , <span className="text-emerald-600 text-2xl">Cura </span>
            gives you 24/7 healthcare support that’s reliable, personal, and secure.
          </motion.p>

          <motion.button
            onClick={handleLogin}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 2 }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 rounded-full bg-emerald-600 text-white text-xl font-medium hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl"
          >
            Start Now
          </motion.button>
        </div>
      </section>

      {/* Why Cura */}

      <section className="px-8 py-24 mt-20  bg-gradient-to-b from-white via-stone-50 to-white">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-light text-stone-800 mb-4">Why Cura</h2>
          <div className="w-28 h-1 bg-emerald-400 mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -2, scale: 1.001 }}
            className="group p-10 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
          >
            <div className="w-30 h-30 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors duration-300">
              <Hourglass className="w-20 h-20 text-emerald-600 opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Always Available</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
              Instant access to care, <span className="text-emerald-600 font-medium">anytime</span> and <span className="text-emerald-600 font-medium">anywhere</span>.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2, scale: 1.001 }}
            className="group p-10 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
          >
            <div className="w-30 h-30 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
              <BookHeart className="w-20 h-20 text-blue-600 opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Made Just for You</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
      Cura tracks your wellness and adapts to your needs over time.      </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2, scale: 1.001 }}
            className="group p-10 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
          >
            <div className="w-30 h-30 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors duration-300">
              <LockKeyhole className="w-20 h-20 text-purple-600 opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Safe and Secure</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
              Your health data is <span className="text-purple-600 font-medium">encrypted</span>, decentralized, and owned by you through ICP.
            </p>
          </motion.div>
        </div>
      </section>
      <section className="px-6 py-24 bg-stone-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-left mb-16 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl text-center font-light mb-4 tracking-tight">How It Works</h2>
            <div className="w-20 h-1 bg-emerald-400 rounded-full"></div>
          </div>

          {/* 2 columns */}
          <div className="flex flex-col md:flex-row gap-12 items-stretch">
            {/* Left: Steps */}
            <div className="flex-1 max-w-md space-y-6">
              {/* Step 1 */}
              <div className="bg-stone-800/70 rounded-xl p-5 shadow-md border border-stone-700 hover:border-emerald-500 transition">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <h3 className="text-base font-medium">Sign Up</h3>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Get started with your Internet Identity.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-stone-800/70 rounded-xl p-5 shadow-md border border-stone-700 hover:border-blue-500 transition">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <h3 className="text-base font-medium">Talk to Cura</h3>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Not feeling well? Just tell Cura your symptoms. You can also share your daily wellness activities.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-stone-800/70 rounded-xl p-5 shadow-md border border-stone-700 hover:border-purple-500 transition">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <h3 className="text-base font-medium">Get Recommendations</h3>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Discover curated doctors and medicines personalized to your health goals.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-stone-800/70 rounded-xl p-5 shadow-md border border-stone-700 hover:border-amber-500 transition">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-semibold">
                    4
                  </span>
                  <h3 className="text-base font-medium">Own Your Data</h3>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Your health data is encrypted, portable, and always in your hands.
                </p>
              </div>
            </div>

            {/* Right: Demo */}
            <div className="flex-1 flex justify-center">
              <CuraDemo />
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-white py-12 px-8 border-t border-stone-200">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-light text-emerald-700 mb-4 tracking-wide">Cura.</div>
          <p className="text-stone-500 font-light">Your trusted companion in health and wellness</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;