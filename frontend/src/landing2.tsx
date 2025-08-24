import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Activity, 
  Users, 
  Pill, 
  Calendar, 
  Zap, 
  Shield, 
  Network, 
  Heart, 
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  Globe
} from "lucide-react";
import { useState, useRef, useEffect } from "react";


// Clean Card Component (matching chat theme)
const CleanCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}> = ({ children, className = "", accentColor = "border-emerald-200" }) => (
  <motion.div
    className={`
      bg-white border ${accentColor} rounded-2xl shadow-sm relative overflow-hidden
      ${className}
    `}
    whileHover={{ 
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

// Creative Text Reveal Component
const TextReveal: React.FC<{ text: string; className?: string; delay?: number }> = ({ text, className = "", delay = 0 }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay }}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.03, duration: 0.3 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// Circular Progress Component
const CircularProgress: React.FC<{ 
  percentage: number; 
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  delay?: number;
}> = ({ percentage, size = 96, strokeWidth = 8, className = "", color = "#10b981", delay = 0 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -180 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 80 }}
    >
      <svg 
        className="w-full h-full -rotate-90" 
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(229 231 235)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: delay + 0.3, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 1, duration: 0.5 }}
      >
        <span className="text-2xl font-bold text-stone-800">{percentage}%</span>
      </motion.div>
    </motion.div>
  );
};

// Dynamic Stats Counter
const StatsCounter: React.FC<{ 
  end: number; 
  suffix?: string;
  className?: string;
  duration?: number;
  delay?: number;
}> = ({ end, suffix = "", className = "", duration = 2, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / (duration * 1000), 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (end - startValue) * easeOutQuart;
        
        setCount(Math.floor(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      
      animate();
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [end, duration, delay, isVisible]);
  
  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => setIsVisible(true)}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="text-4xl font-bold text-emerald-600 mb-2">
        {count.toLocaleString()}{suffix}
      </div>
    </motion.div>
  );
};

// Hero Portal Section
const HeroPortal: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = ["Secure", "Personal", "Intelligent", "Decentralized"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="min-w-full h-screen flex items-center justify-center relative bg-gradient-to-tr from-stone-50 via-white to-emerald-50 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 max-w-7xl px-8">
        {/* Dynamic Stats Bar */}
        <motion.div
          className="flex justify-center gap-8 mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center">
            <StatsCounter end={24} suffix="/7" className="text-3xl font-serif text-emerald-600 mb-2" />
            <p className="text-stone-600 font-light">Available</p>
          </div>
          <div className="text-center">
            <StatsCounter end={99} suffix="%" className="text-3xl font-serif text-emerald-600 mb-2" delay={0.2} />
            <p className="text-stone-600 font-light">Accuracy</p>
          </div>
          <div className="text-center">
            <StatsCounter end={150} suffix="+" className="text-3xl font-serif text-emerald-600 mb-2" delay={0.4} />
            <p className="text-stone-600 font-light">Agents</p>
          </div>
        </motion.div>

        {/* Main Heading with Dynamic Text */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 className="text-6xl md:text-7xl font-light text-stone-800 leading-tight tracking-wide font-serif mb-4">
            <TextReveal text="Your" delay={0.5} className="inline-block" />{" "}
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[currentWordIndex]}
                  className="text-emerald-600 absolute left-0 top-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="invisible">{words[0]}</span>
            </span>
          </h1>
          
          <h2 className="text-6xl md:text-7xl font-light text-stone-800 leading-tight tracking-wide font-serif">
            <TextReveal text="Health" delay={1.2} className="inline-block" />{" "}
            <TextReveal text="Companion" delay={1.4} className="inline-block" />
          </h2>
        </motion.div>

        {/* Floating Feature Pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          {[
            { icon: Brain, text: "AI Powered", delay: 0 },
            { icon: Shield, text: "Encrypted", delay: 0.2 },
            { icon: Globe, text: "Decentralized", delay: 0.4 },
            { icon: TrendingUp, text: "Adaptive", delay: 0.6 },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200 shadow-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2 + feature.delay }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <feature.icon className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-stone-700">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section with Progress Indicators */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
        >
          <motion.button
            onClick={onNavigate}
            className="group px-10 py-4 bg-emerald-600 text-white rounded-full font-medium text-xl hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-3 relative overflow-hidden"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start Your Journey</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          <motion.div
            className="flex items-center gap-2 text-stone-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-sm">Free to start • No credit card required</span>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0], opacity: 1 }}
          transition={{ y: { duration: 2, repeat: Infinity }, opacity: { delay: 4 } }}
          initial={{ opacity: 0 }}
        >
          <div className="w-6 h-10 border-2 border-stone-300 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-emerald-600 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Symptom Analysis Section
const SymptomAnalysis: React.FC = () => {
  const symptoms = ['Headache', 'Fatigue', 'Fever', 'Cough', 'Nausea'];

  return (
    <section className="min-w-full h-screen flex items-center justify-center bg-gradient-to-br from-white via-stone-50 to-white">
      <div className="text-center z-10 max-w-6xl px-8">
        <motion.h2
          className="text-5xl font-light text-stone-800 mb-16 tracking-wide font-serif"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          AI Symptom Analysis
        </motion.h2>

        <div className="relative w-96 h-96 mx-auto mb-16">
          {/* Neural Network Center */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>

          {/* Neural Network Nodes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-md"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: `${100 * Math.cos(i * 45 * Math.PI / 180)}px ${100 * Math.sin(i * 45 * Math.PI / 180)}px`,
              }}
              animate={{ 
                rotate: 360,
                scale: [1, 1.3, 1] 
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, delay: i * 0.3 }
              }}
            />
          ))}

          {/* Floating Symptoms */}
          {symptoms.map((symptom, i) => (
            <motion.div
              key={symptom}
              className="absolute px-4 py-2 bg-white rounded-full text-stone-700 border border-emerald-200 shadow-sm"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + (i % 2) * 70}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 4, delay: i * 0.8 }}
              whileHover={{ scale: 1.1, y: -10 }}
            >
              {symptom}
            </motion.div>
          ))}
        </div>

        <CleanCard className="p-8 max-w-2xl mx-auto" accentColor="border-emerald-200">
          <Brain className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h3 className="text-2xl font-light text-stone-800 mb-4">Intelligent Diagnosis</h3>
          <p className="text-stone-600 font-light leading-relaxed">
            Our AI analyzes your symptoms using advanced neural networks, providing accurate preliminary assessments in seconds.
          </p>
        </CleanCard>
      </div>
    </section>
  );
};

// Multi-Agent Ecosystem Section
const MultiAgentEcosystem: React.FC = () => {
  const agents = [
    { 
      name: 'DoctorAgent', 
      icon: Users, 
      color: 'bg-blue-500', 
      desc: 'Book appointments with verified healthcare professionals', 
      borderColor: 'border-blue-200',
      stats: { percentage: 98, label: 'Satisfaction' }
    },
    { 
      name: 'PharmacyAgent', 
      icon: Pill, 
      color: 'bg-purple-500', 
      desc: 'Order medications with prescription verification', 
      borderColor: 'border-purple-200',
      stats: { percentage: 95, label: 'Accuracy' }
    },
    { 
      name: 'WellnessAgent', 
      icon: Heart, 
      color: 'bg-pink-500', 
      desc: 'Track daily activities and receive personalized tips', 
      borderColor: 'border-pink-200',
      stats: { percentage: 92, label: 'Engagement' }
    },
  ];

  return (
    <section className="min-w-full h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-emerald-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 1, 0.3],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 max-w-7xl px-8">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <TextReveal text="Why Cura" className="text-5xl font-light text-stone-800 mb-4 tracking-wide font-serif" />
        </motion.div>
        
        <motion.div 
          className="w-32 h-1 bg-gradient-to-r from-emerald-400 to-blue-500 mx-auto rounded-full mb-16"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Enhanced ecosystem visualization */}
        <div className="relative w-96 h-96 mx-auto mb-16">
          {/* Central Health Agent with pulsing effect */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-white"
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.4)",
                "0 0 30px rgba(16, 185, 129, 0.6)",
                "0 0 20px rgba(16, 185, 129, 0.4)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Activity className="w-14 h-14 text-white" />
          </motion.div>

          {/* Data flow rings */}
          {[...Array(3)].map((_, ringIndex) => (
            <motion.div
              key={ringIndex}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-emerald-200 rounded-full"
              style={{
                width: `${180 + ringIndex * 60}px`,
                height: `${180 + ringIndex * 60}px`
              }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4 + ringIndex,
                delay: ringIndex * 0.5
              }}
            />
          ))}

          {/* Enhanced orbiting agents */}
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: i * 2 }}
              style={{
                transformOrigin: `${140 * Math.cos(i * 120 * Math.PI / 180)}px ${140 * Math.sin(i * 120 * Math.PI / 180)}px`,
              }}
            >
              <motion.div
                className={`w-full h-full ${agent.color.replace('-500', '-600')} rounded-full flex items-center justify-center shadow-xl cursor-pointer border-4 border-white relative overflow-hidden`}
                whileHover={{ scale: 1.3, rotate: -360 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.5, opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
                <agent.icon className="w-10 h-10 text-white z-10" />
              </motion.div>
            </motion.div>
          ))}

          {/* Enhanced connecting lines with data flow effect */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {agents.map((_, i) => (
              <g key={i}>
                <motion.line
                  x1="50%"
                  y1="50%"
                  x2={`${50 + 35 * Math.cos(i * 120 * Math.PI / 180)}%`}
                  y2={`${50 + 35 * Math.sin(i * 120 * Math.PI / 180)}%`}
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8 }}
                />
                {/* Data packets */}
                <motion.circle
                  r="3"
                  fill="#10b981"
                  animate={{
                    x: [0, 35 * Math.cos(i * 120 * Math.PI / 180) * 2],
                    y: [0, 35 * Math.sin(i * 120 * Math.PI / 180) * 2],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: "easeInOut"
                  }}
                  style={{
                    transformOrigin: '50% 50%'
                  }}
                />
              </g>
            ))}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.8)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Enhanced agent cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 50, rotateX: 45 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8, type: "spring" }}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                rotateX: -5,
                transition: { duration: 0.3 }
              }}
              className="group perspective-1000"
            >
              <CleanCard className="p-8 text-center h-full relative overflow-hidden" accentColor={agent.borderColor}>
                {/* Gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 ${agent.color.replace('-500', '-50')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                />
                
                <motion.div 
                  className={`w-24 h-24 ${agent.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:${agent.color.replace('-500', '-200')} transition-all duration-500 relative z-10 shadow-lg`}
                  whileHover={{ 
                    rotate: 5,
                    scale: 1.1,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                  }}
                >
                  <agent.icon className={`w-12 h-12 ${agent.color.replace('bg-', 'text-').replace('-500', '-600')} opacity-70 group-hover:opacity-100 transition-all duration-300`} />
                </motion.div>
                
                <h3 className="text-2xl font-light text-stone-800 mb-4 relative z-10 group-hover:text-stone-900 transition-colors">
                  {agent.name.replace('Agent', ' Agent')}
                </h3>
                
                <p className="text-stone-600 font-light leading-relaxed mb-6 relative z-10 group-hover:text-stone-700 transition-colors">
                  {agent.desc}
                </p>
                
                {/* Progress indicator for each agent */}
                <div className="flex justify-center relative z-10">
                  <CircularProgress 
                    percentage={agent.stats.percentage} 
                    size={80} 
                    strokeWidth={4}
                    color={agent.color.replace('bg-', '').replace('-500', '') === 'blue' ? '#3b82f6' : 
                           agent.color.replace('bg-', '').replace('-500', '') === 'purple' ? '#8b5cf6' : '#ec4899'}
                    delay={0.5 + i * 0.2}
                  />
                </div>
                <p className="text-sm text-stone-500 mt-2 relative z-10">{agent.stats.label}</p>
              </CleanCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Medicine & Reminders Section
const MedicineReminders: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  
  const steps = [
    { 
      step: 1, 
      title: 'Sign Up', 
      desc: 'Get started with your Internet Identity for secure, decentralized access.', 
      color: 'emerald',
      icon: Shield,
      bgColor: 'bg-emerald-600',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-600'
    },
    { 
      step: 2, 
      title: 'Talk to Cura', 
      desc: 'Not feeling well? Just tell Cura your symptoms. Share your daily wellness activities too.', 
      color: 'blue',
      icon: Brain,
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      step: 3, 
      title: 'Get Recommendations', 
      desc: 'Discover curated doctors and medicines personalized to your unique health goals.', 
      color: 'purple',
      icon: Users,
      bgColor: 'bg-purple-600',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600'
    },
    { 
      step: 4, 
      title: 'Own Your Data', 
      desc: 'Your health data remains encrypted, portable, and always in your complete control.', 
      color: 'amber',
      icon: Network,
      bgColor: 'bg-amber-600',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-600'
    },
  ];

  return (
    <section className="min-w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-stone-900 to-gray-900 text-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 max-w-7xl px-8">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <TextReveal text="How It Works" className="text-4xl md:text-5xl font-light mb-4 tracking-tight text-center font-serif" />
        </motion.div>
        
        <motion.div 
          className="w-24 h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 rounded-full mx-auto mb-16"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        <div className="flex flex-col lg:flex-row gap-16 items-center max-w-6xl mx-auto">
          {/* Enhanced Steps */}
          <div className="flex-1 max-w-2xl">
            <div className="space-y-8">
              {steps.map((item, i) => (
                <motion.div
                  key={i}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/10 hover:${item.borderColor} hover:bg-white/10 transition-all duration-500 cursor-pointer group relative overflow-hidden`}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.8, type: "spring" }}
                  whileHover={{ 
                    scale: 1.02, 
                    x: 10,
                    transition: { duration: 0.3 }
                  }}
                  onHoverStart={() => setActiveStep(i)}
                  onHoverEnd={() => setActiveStep(null)}
                >
                  {/* Gradient overlay */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color === 'emerald' ? 'from-emerald-500/10' : 
                                item.color === 'blue' ? 'from-blue-500/10' :
                                item.color === 'purple' ? 'from-purple-500/10' : 'from-amber-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  
                  <div className="flex items-start gap-6 relative z-10">
                    <motion.div 
                      className={`w-16 h-16 ${item.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500`}
                      whileHover={{ 
                        rotate: 5,
                        scale: 1.1,
                      }}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <motion.div
                          className={`w-8 h-8 ${item.bgColor} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}
                          whileHover={{ scale: 1.2 }}
                        >
                          {item.step}
                        </motion.div>
                        <h3 className={`text-xl font-medium ${item.textColor} group-hover:text-white transition-colors duration-300`}>
                          {item.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <motion.div
                    className={`absolute bottom-0 left-0 h-1 ${item.bgColor} rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: activeStep === i ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Connection lines */}
            <div className="absolute left-8 top-20 bottom-20 w-0.5 bg-gradient-to-b from-emerald-500 via-purple-500 to-amber-500 opacity-30" />
          </div>

          {/* Enhanced Demo Chat */}
          <div className="flex-1 flex justify-center">
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <CleanCard className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-0">
                {/* Chat header with enhanced design */}
                <motion.div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between rounded-t-3xl relative overflow-hidden"
                  whileHover={{ 
                    background: "linear-gradient(to right, #059669, #047857)" 
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <div className="flex items-center gap-3 relative z-10">
                    <motion.div
                      className="w-3 h-3 bg-green-300 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <h3 className="text-white font-semibold">Cura Health Assistant</h3>
                  </div>
                  <Heart className="w-5 h-5 text-white/80" />
                </motion.div>
                
                {/* Chat messages with enhanced animations */}
                <div className="flex-1 p-4 space-y-4 bg-gradient-to-br from-stone-50 to-white min-h-64">
                  {[
                    { text: "I've had mild chest tightness today.", isUser: true, delay: 0 },
                    { text: "I understand your concern. Let me help analyze your symptoms. Any other details?", isUser: false, delay: 1 },
                    { text: "I completed a 30-minute walk earlier today.", isUser: true, delay: 2 },
                    { text: "Excellent! I've recorded your activity. Based on your symptoms and exercise, I recommend consulting Dr. Smith for a cardiovascular check. Would you like me to book an appointment?", isUser: false, delay: 3 }
                  ].map((msg, i) => (
                    <motion.div 
                      key={i} 
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: msg.delay * 0.5, duration: 0.6, type: "spring" }}
                    >
                      {!msg.isUser && (
                        <motion.div 
                          className="flex-shrink-0 mr-3 mt-1"
                          animate={{ rotate: [0, 10, 0] }}
                          transition={{ repeat: Infinity, duration: 3, delay: msg.delay }}
                        >
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Heart className="w-4 h-4 text-emerald-600" />
                          </div>
                        </motion.div>
                      )}
                      
                      <motion.div 
                        className={`max-w-[80%] px-4 py-3 text-sm rounded-2xl shadow-sm relative ${
                          msg.isUser 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md' 
                            : 'bg-white text-gray-800 rounded-bl-md shadow-md border border-gray-100'
                        }`}
                        whileHover={{ 
                          scale: 1.02,
                          y: -2,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: msg.delay * 0.5 + 0.3, duration: 0.8 }}
                          className="overflow-hidden"
                        >
                          {msg.text}
                        </motion.div>
                        
                        {/* Typing indicator for AI messages */}
                        {!msg.isUser && (
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: msg.delay * 0.5 }}
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </CleanCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Booking & Emergency Section
const BookingEmergency: React.FC = () => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(15);

  const appointments = [
    { date: 15, time: '10:30 AM', doctor: 'Dr. Smith - Cardiology', type: 'heart' },
    { date: 18, time: '2:00 PM', doctor: 'Dr. Jones - General', type: 'general' },
    { date: 22, time: '9:00 AM', doctor: 'Dr. Wilson - Dermatology', type: 'skin' },
  ];

  const emergencyFeatures = [
    { icon: Clock, text: 'Instant Response', color: 'text-red-500' },
    { icon: Heart, text: '24/7 Available', color: 'text-red-600' },
    { icon: Shield, text: 'Verified Doctors', color: 'text-red-500' },
  ];

  return (
    <section className="min-w-full h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-stone-50 relative overflow-hidden">
      {/* Floating medical icons */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[Heart, Calendar, Clock, Shield].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 20}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          >
            <Icon className="w-8 h-8 text-emerald-400" />
          </motion.div>
        ))}
      </div>

      <div className="text-center z-10 max-w-7xl px-8">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <TextReveal text="Always Available" className="text-5xl font-light text-stone-800 mb-4 tracking-wide font-serif" />
        </motion.div>
        
        <motion.div 
          className="w-32 h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-red-400 mx-auto rounded-full mb-16"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        <div className="flex items-center justify-center gap-16 lg:gap-24">
          {/* Enhanced Calendar Card */}
          <motion.div
            className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6 }}
            whileHover={{ scale: 1.02, y: -8 }}
          >
            <CleanCard className="w-96 h-[400px] p-8 relative overflow-hidden group" accentColor="border-emerald-200">
              {/* Calendar glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
              />
              
              <div className="relative z-10">
                <motion.div 
                  className="text-emerald-600 font-bold text-2xl mb-8 flex items-center justify-between"
                  animate={{ color: ["#059669", "#0d9488", "#059669"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span>December 2024</span>
                  <Calendar className="w-6 h-6" />
                </motion.div>
                
                <div className="grid grid-cols-7 gap-2 text-xs mb-6">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center font-semibold text-stone-500 py-2">
                      {day}
                    </div>
                  ))}
                  {[...Array(35)].map((_, i) => {
                    const dayNum = i + 1;
                    const hasAppointment = appointments.some(apt => apt.date === dayNum);
                    const isSelected = dayNum === selectedDate;
                    
                    return (
                      <motion.div
                        key={i}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'bg-emerald-500 text-white font-bold shadow-lg' 
                            : hasAppointment 
                            ? 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200' 
                            : dayNum <= 31 
                            ? 'text-stone-600 hover:bg-emerald-50' 
                            : 'text-transparent'
                        }`}
                        whileHover={{ scale: dayNum <= 31 ? 1.1 : 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => dayNum <= 31 && setSelectedDate(dayNum)}
                      >
                        {dayNum <= 31 ? dayNum : ''}
                        
                        {hasAppointment && (
                          <motion.div
                            className="absolute w-2 h-2 bg-red-400 rounded-full -top-1 -right-1"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Enhanced appointment list */}
                <div className="space-y-3">
                  <motion.h3 
                    className="text-stone-700 font-semibold mb-4 flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Upcoming Appointments
                  </motion.h3>
                  
                  {appointments.map((apt, i) => (
                    <motion.div
                      key={i}
                      className="p-4 bg-gradient-to-r from-stone-50 to-emerald-50 rounded-xl border border-stone-100 hover:border-emerald-200 transition-all duration-300 group cursor-pointer"
                      whileHover={{ 
                        scale: 1.02, 
                        x: 5,
                        boxShadow: "0 5px 15px rgba(0,0,0,0.1)" 
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-emerald-600 font-semibold text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                            Dec {apt.date} • {apt.time}
                          </div>
                          <div className="text-stone-600 text-sm mt-1">{apt.doctor}</div>
                        </div>
                        <motion.div
                          className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors"
                          whileHover={{ rotate: 15 }}
                        >
                          {apt.type === 'heart' ? <Heart className="w-4 h-4 text-emerald-600" /> :
                           apt.type === 'general' ? <Users className="w-4 h-4 text-emerald-600" /> :
                           <Activity className="w-4 h-4 text-emerald-600" />}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CleanCard>
          </motion.div>

          {/* Enhanced Emergency Section */}
          <div className="relative flex flex-col items-center">
            {/* Emergency button with advanced animations */}
            <motion.div className="relative">
              <motion.button
                className="w-80 h-80 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full flex flex-col items-center justify-center text-white shadow-2xl font-bold text-3xl relative overflow-hidden group"
                animate={{ 
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 0 30px rgba(239, 68, 68, 0.4)",
                    "0 0 50px rgba(239, 68, 68, 0.6)",
                    "0 0 30px rgba(239, 68, 68, 0.4)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 60px rgba(239, 68, 68, 0.8)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEmergencyActive(!emergencyActive)}
              >
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                
                {/* Inner glow */}
                <motion.div
                  className="absolute inset-4 bg-gradient-to-br from-white/20 to-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Heart className="w-16 h-16 mb-4 relative z-10" />
                </motion.div>
                
                <span className="relative z-10">Emergency</span>
                
                {/* Pulse rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-red-300 rounded-full"
                    animate={{ 
                      scale: [1, 2, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      delay: i * 1
                    }}
                  />
                ))}
              </motion.button>
              
              {/* Floating feature indicators */}
              <div className="absolute -top-8 -left-8 -right-8 -bottom-8">
                {emergencyFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${50 + 40 * Math.cos(i * 120 * Math.PI / 180)}%`,
                      top: `${50 + 40 * Math.sin(i * 120 * Math.PI / 180)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  >
                    <div className="bg-white rounded-full p-3 shadow-lg border border-red-100">
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="mt-8 text-stone-600 text-lg font-light"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              24/7 Support Available
            </motion.div>

            <AnimatePresence>
              {emergencyActive && (
                <motion.div
                  className="absolute top-full mt-12 left-1/2 -translate-x-1/2 w-80"
                  initial={{ opacity: 0, y: -30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <CleanCard className="p-6 bg-red-50 border-red-200 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-red-100 to-transparent"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    
                    <div className="relative z-10 text-center">
                      <motion.div 
                        className="text-red-600 font-bold text-xl mb-3 flex items-center justify-center gap-2"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        🚑 Emergency Support
                      </motion.div>
                      
                      <div className="text-stone-700 text-sm mb-4">
                        Connecting you to immediate medical assistance...
                      </div>
                      
                      <div className="flex justify-center gap-2 mb-3">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-red-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
                      
                      <div className="text-xs text-stone-500">
                        Average response time: <span className="font-semibold text-red-600">30 seconds</span>
                      </div>
                    </div>
                  </CleanCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-lg text-stone-600 font-light leading-relaxed mb-8">
            Instant access to care, <span className="text-emerald-600 font-medium">anytime</span> and <span className="text-emerald-600 font-medium">anywhere</span>. 
            Book appointments or get emergency support with a single tap.
          </p>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Calendar, title: 'Smart Scheduling', desc: 'AI-powered appointment optimization' },
              { icon: Clock, title: 'Instant Response', desc: 'Emergency support in under 30 seconds' },
              { icon: Shield, title: 'Verified Network', desc: 'Licensed healthcare professionals only' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-4 bg-white/50 rounded-xl border border-stone-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-stone-800 font-medium">{item.title}</h3>
                  <p className="text-stone-500 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Final CTA Section  
const FinalCTA: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const techFeatures = [
    { icon: Shield, text: 'End-to-End Encrypted', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Network, text: 'Decentralized Storage', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Zap, text: 'AI-Powered Insights', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const stats = [
    { number: 99.9, suffix: '%', label: 'Uptime', color: 'text-emerald-600' },
    { number: 24, suffix: '/7', label: 'Available', color: 'text-blue-600' },
    { number: 256, suffix: '-bit', label: 'Encryption', color: 'text-purple-600' },
  ];

  return (
    <section className="min-w-full h-screen flex flex-col bg-gradient-to-br from-white via-stone-50 to-emerald-50 relative overflow-hidden">
      {/* Sophisticated background effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-emerald-200/30 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-32 right-20 w-80 h-80 bg-gradient-radial from-blue-200/30 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, -40, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-purple-200/20 to-transparent rounded-full blur-2xl"
          animate={{ 
            rotate: 360,
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        />

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 relative z-10">
        <div className="text-center max-w-7xl">
          {/* Enhanced heading with character-by-character animation */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl md:text-8xl font-light text-stone-800 leading-tight tracking-wide font-serif mb-8">
              <TextReveal text="Your health companion," className="inline-block" delay={0.2} />
              <br />
              <span className="relative inline-block">
                <TextReveal text="anytime" className="text-emerald-600 inline-block" delay={0.8} />
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 1.3 }}
                  className="absolute -bottom-3 left-0 w-full h-2 bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full opacity-60 origin-left"
                />
              </span>
              <TextReveal text=", " className="inline-block" delay={1} />
              <span className="relative inline-block">
                <TextReveal text="anywhere" className="text-blue-600 inline-block" delay={1.2} />
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 1.7 }}
                  className="absolute -bottom-3 left-0 w-full h-2 bg-gradient-to-r from-blue-300 to-blue-500 rounded-full opacity-60 origin-left"
                />
              </span>
              <TextReveal text="." className="inline-block" delay={1.4} />
            </h1>
          </motion.div>

          {/* Enhanced stats section */}
          <motion.div
            className="flex justify-center gap-12 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 2 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2 + i * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
              >
                <div className={`text-5xl font-light ${stat.color} mb-2 font-serif`}>
                  <StatsCounter end={stat.number} suffix={stat.suffix} />
                </div>
                <div className="text-stone-600 font-light tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced description */}
          <motion.div
            className="max-w-4xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 2.5 }}
          >
            <p className="text-xl text-stone-600 font-light leading-relaxed mb-8">
              Built on cutting-edge technology including{" "}
              <motion.span 
                className="font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)" }}
              >
                <Sparkles className="w-4 h-4" />
                Fetch.ai
              </motion.span>{" "}
              and the{" "}
              <motion.span 
                className="font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)" }}
              >
                <Network className="w-4 h-4" />
                Internet Computer (ICP)
              </motion.span>
              , <motion.span 
                className="text-emerald-600 text-3xl font-light"
                animate={{ textShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 10px rgba(16, 185, 129, 0.3)", "0 0 0px rgba(16, 185, 129, 0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Cura
              </motion.span>{" "}
              delivers 24/7 healthcare support that's intelligent, secure, and truly decentralized.
            </p>
          </motion.div>

          {/* Enhanced CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-8 justify-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 3 }}
          >
            <motion.button
              onClick={onLogin}
              className="group relative px-12 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full font-medium text-xl shadow-lg hover:shadow-2xl flex items-center gap-4 overflow-hidden"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setIsHovering(true)}
              onHoverEnd={() => setIsHovering(false)}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              
              <motion.div
                animate={{ rotate: isHovering ? 360 : 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span className="relative z-10">Start Your Journey</span>
              <motion.div
                animate={{ x: isHovering ? 5 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>

              {/* Particle burst effect */}
              <AnimatePresence>
                {isHovering && [...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos(i * 60 * Math.PI / 180) * 40,
                      y: Math.sin(i * 60 * Math.PI / 180) * 40,
                      opacity: [0, 1, 0],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                ))}
              </AnimatePresence>
            </motion.button>
            
            <motion.button
              className="group relative px-12 py-5 bg-white text-emerald-600 rounded-full font-medium text-xl border-2 border-emerald-600 hover:bg-emerald-50 transition-all duration-300 flex items-center gap-4 overflow-hidden"
              whileHover={{ scale: 1.05, y: -5, borderColor: '#059669' }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Zap className="w-6 h-6" />
              </motion.div>
              <span>See on Agentverse</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
              />
            </motion.button>
          </motion.div>

          {/* Enhanced feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 3.5 }}
          >
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {techFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  className="group relative"
                  initial={{ opacity: 0, y: 30, rotateY: -45 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: 3.7 + i * 0.1, duration: 0.8 }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5, 
                    z: 50,
                    transition: { duration: 0.3 }
                  }}
                >
                  <CleanCard className="p-8 h-full text-center relative overflow-hidden">
                    {/* Animated background */}
                    <motion.div
                      className={`absolute inset-0 ${feature.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                    />
                    
                    <motion.div 
                      className={`w-20 h-20 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:shadow-lg transition-shadow duration-300`}
                      whileHover={{ 
                        rotate: 10, 
                        scale: 1.1,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                      }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <feature.icon className={`w-10 h-10 ${feature.color} relative z-10`} />
                      </motion.div>
                    </motion.div>
                    
                    <h3 className={`text-xl font-medium ${feature.color} mb-3 relative z-10 group-hover:scale-105 transition-transform duration-300`}>
                      {feature.text}
                    </h3>
                    
                    {/* Progress indicator */}
                    <div className="relative z-10 mt-6">
                      <CircularProgress 
                        percentage={95 + i * 2} 
                        size={60} 
                        strokeWidth={3}
                        color={feature.color === 'text-emerald-600' ? '#059669' : 
                               feature.color === 'text-blue-600' ? '#2563eb' : '#9333ea'}
                        delay={4 + i * 0.2}
                      />
                    </div>
                  </CleanCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <motion.footer 
        className="bg-white/80 backdrop-blur-sm py-16 px-8 border-t border-stone-200/50 relative"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 4 }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div 
            className="text-4xl font-light text-emerald-700 mb-6 tracking-wide font-serif"
            animate={{ 
              textShadow: [
                "0 0 0px rgba(16, 185, 129, 0)",
                "0 0 20px rgba(16, 185, 129, 0.3)",
                "0 0 0px rgba(16, 185, 129, 0)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Cura.
          </motion.div>
          
          <motion.p 
            className="text-stone-600 font-light text-lg mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 4.2 }}
          >
            Your trusted companion in health and wellness
          </motion.p>
          
          {/* Social proof indicators */}
          <motion.div
            className="flex justify-center items-center gap-8 text-sm text-stone-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 4.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live on ICP</span>
            </div>
            <div className="w-1 h-4 bg-stone-300" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-stone-400" />
              <span>Enterprise Security</span>
            </div>
            <div className="w-1 h-4 bg-stone-300" />
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Healthcare Focused</span>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </section>
  );
};

// Navigation Component
const Navigation: React.FC<{ 
  currentSection: number; 
  onNavigate: (section: number) => void;
  totalSections: number;
}> = ({ currentSection, onNavigate, totalSections }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {[...Array(totalSections)].map((_, i) => (
        <motion.button
          key={i}
          className={`w-4 h-4 rounded-full transition-all duration-300 ${
            i === currentSection 
              ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30' 
              : 'bg-stone-300 hover:bg-stone-400'
          }`}
          onClick={() => onNavigate(i)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}
    </div>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = 6;
  
  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (sectionIndex: number) => {
    if (containerRef.current) {
      const sectionWidth = window.innerWidth;
      containerRef.current.scrollTo({
        left: sectionIndex * sectionWidth,
        behavior: 'smooth'
      });
      setCurrentSection(sectionIndex);
    }
  };

  const scrollToNextSection = () => {
    const nextSection = Math.min(currentSection + 1, totalSections - 1);
    scrollToSection(nextSection);
  };

  const scrollToPrevSection = () => {
    const prevSection = Math.max(currentSection - 1, 0);
    scrollToSection(prevSection);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollLeft = containerRef.current.scrollLeft;
        const sectionWidth = window.innerWidth;
        const section = Math.round(scrollLeft / sectionWidth);
        setCurrentSection(section);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        scrollToNextSection();
      } else if (event.key === 'ArrowLeft') {
        scrollToPrevSection();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        // Horizontal scroll detected, let it work naturally
        return;
      }
      
      // Convert vertical scroll to horizontal navigation
      event.preventDefault();
      if (event.deltaY > 0) {
        scrollToNextSection();
      } else if (event.deltaY < 0) {
        scrollToPrevSection();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentSection]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-tr from-stone-50 via-white to-emerald-50 text-stone-800 font-serif">
      {/* Progress Indicator */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {[...Array(totalSections)].map((_, i) => (
          <motion.div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === currentSection ? 'bg-emerald-600 w-12' : 'bg-stone-300 w-8'
            }`}
            onClick={() => scrollToSection(i)}
            whileHover={{ scale: 1.1 }}
          />
        ))}
      </div>

      {/* Side Navigation */}
      <Navigation 
        currentSection={currentSection} 
        onNavigate={scrollToSection}
        totalSections={totalSections}
      />

      {/* Navigation Instructions */}
      <div className="fixed bottom-8 left-8 z-50 text-stone-400 text-sm font-light">
        <div>← → Arrow keys</div>
        <div>Mouse wheel</div>
        <div>Click dots →</div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={containerRef}
        className="flex h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <HeroPortal onNavigate={scrollToNextSection} />
        <SymptomAnalysis />
        <MultiAgentEcosystem />
        <MedicineReminders />
        <BookingEmergency />
        <FinalCTA onLogin={handleLogin} />
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default LandingPage;