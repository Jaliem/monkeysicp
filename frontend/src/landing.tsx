import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
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
  Globe,
  Plus,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Stethoscope,
  Tablet,
  Bell
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Animated particles background
const ParticleField: React.FC = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-[#00c26e] rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// DNA Strand Animation
const DNAStrand: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-10">
      <svg width="300" height="600" viewBox="0 0 300 600">
        {Array.from({ length: 60 }, (_, i) => {
          const y = i * 10;
          const angle = (i / 60) * Math.PI * 6;
          const x1 = 150 + Math.cos(angle) * 50;
          const x2 = 150 - Math.cos(angle) * 50;
          
          return (
            <g key={i}>
              <motion.circle
                cx={x1}
                cy={y}
                r="3"
                fill="#00c26e"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
              <motion.circle
                cx={x2}
                cy={y}
                r="3"
                fill="#00c26e"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1 + 0.5,
                }}
              />
              {i % 4 === 0 && (
                <motion.line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#00c26e"
                  strokeWidth="1"
                  opacity="0.5"
                  animate={{
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Glassmorphic Card Component
const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}> = ({ children, className = "", hover = true }) => {
  return (
    <motion.div
      className={`
        backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        ${hover ? 'hover:bg-white/20 hover:shadow-[0_8px_32px_0_rgba(0,194,110,0.2)]' : ''}
        transition-all duration-500 ${className}
      `}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Hero Section
const HeroSection: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);

  return (
    <section className="min-w-full h-screen flex items-center justify-center relative bg-white overflow-hidden snap-start">
      <ParticleField />
      
      <div className="text-center z-10 max-w-6xl px-8">
        {/* Logo Animation */}
        <motion.div
          className="mb-12"
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          onAnimationComplete={() => setLogoAnimationComplete(true)}
        >
          <motion.div
            className="text-8xl md:text-9xl font-black text-[#00c26e] mb-4"
            animate={logoAnimationComplete ? {
              textShadow: [
                "0 0 20px rgba(0, 194, 110, 0.5)",
                "0 0 40px rgba(0, 194, 110, 0.8)",
                "0 0 20px rgba(0, 194, 110, 0.5)"
              ]
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            CURA
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-light text-gray-800 mb-6 leading-tight">
            Your Health,{" "}
            <span className="relative">
              <span className="text-[#00c26e] font-semibold">Reimagined</span>
              <motion.div
                className="absolute -bottom-2 left-0 w-full h-1 bg-[#00c26e]/30 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2, duration: 1 }}
              />
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light">
            Powered by Decentralization
          </p>
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onNext}
          className="group relative px-12 py-4 bg-[#00c26e] text-white text-xl font-medium rounded-full shadow-lg hover:shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#00c26e] to-emerald-500"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10 flex items-center gap-3">
            Begin Your Journey
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </motion.button>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-[#00c26e] rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Health Agent Panel
const HealthAgentPanel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const symptoms = ["Fatigue", "Headache", "Fever"];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 4);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isInView]);

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-gray-50 snap-start relative overflow-hidden">
      <ParticleField />
      
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: AI Chat Interface */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-[#00c26e]" />
              <h2 className="text-2xl font-semibold text-gray-800">Health Agent</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-[#00c26e] text-white px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                  I've been experiencing fatigue, headaches, and mild fever
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-white/70 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs border">
                  Based on your symptoms, this could indicate a viral infection. I recommend rest, hydration, and monitoring your temperature.
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-white/70 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs border">
                  Would you like me to book an appointment with Dr. Smith for a consultation?
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Analysis Flow */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="space-y-8"
        >
          <h1 className="text-5xl font-light text-gray-800 mb-12">
            AI Health Analysis
          </h1>
          
          {/* Flow Steps */}
          <div className="space-y-6">
            {[
              { title: "Symptom Input", icon: MessageSquare, color: currentStep >= 0 ? "#00c26e" : "#e5e7eb" },
              { title: "Pattern Analysis", icon: Brain, color: currentStep >= 1 ? "#00c26e" : "#e5e7eb" },
              { title: "Risk Assessment", icon: Activity, color: currentStep >= 2 ? "#00c26e" : "#e5e7eb" },
              { title: "Recommendation", icon: Check, color: currentStep >= 3 ? "#00c26e" : "#e5e7eb" },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4"
                animate={{ opacity: currentStep >= i ? 1 : 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: step.color }}
                  animate={{ scale: currentStep === i ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-xl font-medium text-gray-800">{step.title}</span>
                {currentStep === i && (
                  <motion.div
                    className="w-2 h-2 bg-[#00c26e] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Doctor Agent Panel
const DoctorAgentPanel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const timeSlots = [
    { time: "9:00 AM", available: true },
    { time: "10:30 AM", available: false },
    { time: "2:00 PM", available: true },
    { time: "3:30 PM", available: true },
    { time: "4:00 PM", available: false },
  ];

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-white snap-start relative overflow-hidden">
      <ParticleField />
      
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Doctor Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1 }}
          className="flex justify-center"
        >
          <GlassCard className="p-12" hover={false}>
            <div className="text-center">
              <motion.div
                className="w-48 h-48 bg-gradient-to-br from-[#00c26e]/20 to-emerald-200/20 rounded-full mx-auto mb-8 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Stethoscope className="w-24 h-24 text-[#00c26e]" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Dr. Sarah Smith</h3>
              <p className="text-gray-600">Cardiologist</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-[#00c26e] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Booking Calendar */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 className="text-5xl font-light text-gray-800 mb-12">
            Book Appointment
          </h1>
          
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[#00c26e]" />
              <h3 className="text-xl font-semibold text-gray-800">Available Slots Today</h3>
            </div>
            
            <div className="grid gap-3">
              {timeSlots.map((slot, i) => (
                <motion.button
                  key={i}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                    !slot.available 
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : selectedSlot === slot.time
                      ? 'border-[#00c26e] bg-[#00c26e]/10 text-[#00c26e] shadow-lg shadow-[#00c26e]/20'
                      : 'border-gray-200 hover:border-[#00c26e] hover:bg-[#00c26e]/5'
                  }`}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                  whileHover={slot.available ? { scale: 1.02 } : {}}
                  whileTap={slot.available ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{slot.time}</span>
                    {slot.available ? (
                      <div className="w-3 h-3 bg-[#00c26e] rounded-full animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
            
            {selectedSlot && (
              <motion.button
                className="w-full mt-6 py-3 bg-[#00c26e] text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Confirm Appointment at {selectedSlot}
              </motion.button>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};

// Pharmacy Agent Panel
const PharmacyAgentPanel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const medications = [
    { name: "Ibuprofen", price: "$12.99", stock: "In Stock", color: "#ff6b6b" },
    { name: "Amoxicillin", price: "$24.50", stock: "Low Stock", color: "#4ecdc4" },
    { name: "Metformin", price: "$18.75", stock: "In Stock", color: "#45b7d1" },
  ];

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-gray-50 snap-start relative overflow-hidden">
      <ParticleField />
      
      <div className="max-w-7xl mx-auto px-8">
        <motion.h1
          className="text-6xl font-light text-gray-800 text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          Pharmacy Agent
        </motion.h1>

        {/* 3D Pill Animation */}
        <div className="relative h-96 mb-16">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{
                transformOrigin: `${150 + i * 20}px 0px`,
              }}
              animate={{
                rotateZ: 360,
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <motion.div
                className="w-8 h-16 bg-gradient-to-b from-[#00c26e] to-emerald-400 rounded-full shadow-lg -translate-x-4 -translate-y-8"
                animate={{
                  rotateY: [0, 180, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Medication Carousel */}
        <div className="grid md:grid-cols-3 gap-8">
          {medications.map((med, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 100 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.2 }}
            >
              <GlassCard className="p-6 text-center">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${med.color}20` }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Tablet className="w-8 h-8" style={{ color: med.color }} />
                </motion.div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{med.name}</h3>
                <p className="text-2xl font-bold text-[#00c26e] mb-2">{med.price}</p>
                <p className="text-sm text-gray-600 mb-4">{med.stock}</p>
                
                <motion.button
                  className="w-full py-3 bg-[#00c26e] text-white rounded-2xl font-medium hover:bg-emerald-600 transition-colors duration-300"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 194, 110, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add to Cart
                </motion.button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Wellness Agent Panel
const WellnessAgentPanel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [activeReminder, setActiveReminder] = useState<number | null>(null);

  const reminders = [
    { time: "8:00 AM", task: "Morning Medication", type: "pill" },
    { time: "12:00 PM", task: "Hydration Check", type: "water" },
    { time: "6:00 PM", task: "Evening Walk", type: "exercise" },
    { time: "10:00 PM", task: "Sleep Reminder", type: "sleep" },
  ];

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-white snap-start relative overflow-hidden">
      {/* Animated Heartbeat Line */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg width="100%" height="200" viewBox="0 0 800 200">
          <motion.path
            d="M0,100 L200,100 L220,60 L240,140 L260,20 L280,180 L300,100 L800,100"
            stroke="#00c26e"
            strokeWidth="3"
            fill="none"
            animate={{
              strokeDashoffset: [0, -800],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              strokeDasharray: "800",
            }}
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Calendar with Reminders */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-light text-gray-800 mb-12">
            Wellness Agent
          </h1>
          
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-[#00c26e]" />
              <h3 className="text-xl font-semibold text-gray-800">Today's Wellness Plan</h3>
            </div>
            
            <div className="space-y-4">
              {reminders.map((reminder, i) => (
                <motion.div
                  key={i}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeReminder === i
                      ? 'bg-[#00c26e]/10 border-2 border-[#00c26e]'
                      : 'bg-white/50 border-2 border-gray-200 hover:border-[#00c26e]/50'
                  }`}
                  onClick={() => setActiveReminder(activeReminder === i ? null : i)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#00c26e] rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium text-gray-800">{reminder.task}</p>
                        <p className="text-sm text-gray-600">{reminder.time}</p>
                      </div>
                    </div>
                    <Bell className="w-5 h-5 text-[#00c26e]" />
                  </div>
                  
                  <AnimatePresence>
                    {activeReminder === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <p className="text-sm text-gray-600">
                          Tap to mark as complete or snooze for 15 minutes
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button className="px-4 py-2 bg-[#00c26e] text-white rounded-lg text-sm font-medium">
                            Complete
                          </button>
                          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                            Snooze
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Right: Wellness Stats */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="space-y-8"
        >
          {[
            { label: "Daily Steps", value: "8,742", target: "10,000", progress: 87 },
            { label: "Water Intake", value: "6 glasses", target: "8 glasses", progress: 75 },
            { label: "Sleep Quality", value: "7.5 hrs", target: "8 hrs", progress: 94 },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-800">{stat.label}</h4>
                <span className="text-2xl font-bold text-[#00c26e]">{stat.value}</span>
              </div>
              
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-[#00c26e] rounded-full"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${stat.progress}%` } : {}}
                  transition={{ duration: 1.5, delay: i * 0.2 + 0.5 }}
                />
              </div>
              
              <p className="text-sm text-gray-600 mt-2">Target: {stat.target}</p>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Emergency Panel
const EmergencyPanel: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [emergencyActive, setEmergencyActive] = useState(false);

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-800 snap-start relative overflow-hidden">
      <div className="text-center z-10">
        <motion.h1
          className="text-6xl font-light text-white mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          Emergency Support
        </motion.h1>

        {/* SOS Button */}
        <motion.button
          className="relative w-64 h-64 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl"
          onClick={() => setEmergencyActive(!emergencyActive)}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 0 0 rgba(239, 68, 68, 0.4)",
              "0 0 0 40px rgba(239, 68, 68, 0)",
              "0 0 0 0 rgba(239, 68, 68, 0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-16 h-16 mb-2" />
            <span>SOS</span>
          </div>
          
          {/* Pulse rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-4 border-red-300 rounded-full"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
              }}
            />
          ))}
        </motion.button>

        <motion.p
          className="text-white/80 text-xl mt-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        >
          24/7 emergency response available. Press SOS for immediate assistance.
        </motion.p>

        <AnimatePresence>
          {emergencyActive && (
            <motion.div
              className="absolute top-full mt-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
            >
              <GlassCard className="p-6 bg-red-500/20">
                <div className="text-white text-center">
                  <div className="font-bold text-lg mb-2">🚨 Emergency Alert Sent</div>
                  <div className="text-sm">Connecting to nearest emergency services...</div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

// Final CTA Panel
const FinalCTAPanel: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="min-w-full h-screen flex items-center justify-center bg-white snap-start relative overflow-hidden">
      <DNAStrand />
      
      <GlassCard className="max-w-4xl mx-auto p-16 text-center" hover={false}>
        <motion.h1
          className="text-6xl font-light text-gray-800 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          Healthcare,{" "}
          <span className="text-[#00c26e] font-medium">Reimagined</span>
          <br />
          for the Decentralized Era
        </motion.h1>

        <motion.p
          className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Join thousands who have transformed their healthcare experience with AI-powered agents,
          decentralized data ownership, and seamless care coordination.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <motion.button
            onClick={onLogin}
            className="px-12 py-4 bg-[#00c26e] text-white text-xl font-medium rounded-full shadow-lg hover:bg-emerald-600 transition-colors duration-300"
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 194, 110, 0.3)" }}
            whileTap={{ scale: 0.95 }}
          >
            Start with Health Agent
          </motion.button>
          
          <motion.button
            className="px-12 py-4 bg-white text-[#00c26e] text-xl font-medium rounded-full border-2 border-[#00c26e] hover:bg-[#00c26e]/5 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore on Agentverse
          </motion.button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="flex justify-center items-center gap-8 mt-16 opacity-60"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.6 } : {}}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00c26e]" />
            <span className="text-gray-700">End-to-End Encrypted</span>
          </div>
          <div className="w-1 h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#00c26e]" />
            <span className="text-gray-700">Decentralized</span>
          </div>
          <div className="w-1 h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00c26e]" />
            <span className="text-gray-700">AI-Powered</span>
          </div>
        </motion.div>
      </GlassCard>
    </section>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = 7;

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (index: number) => {
    if (containerRef.current) {
      const sectionWidth = window.innerWidth;
      containerRef.current.scrollTo({
        left: index * sectionWidth,
        behavior: 'smooth'
      });
      setCurrentSection(index);
    }
  };

  const scrollToNext = () => {
    const nextSection = Math.min(currentSection + 1, totalSections - 1);
    scrollToSection(nextSection);
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

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY > 0 && currentSection < totalSections - 1) {
        scrollToNext();
      } else if (event.deltaY < 0 && currentSection > 0) {
        scrollToSection(currentSection - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentSection]);

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Progress Indicator */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {[...Array(totalSections)].map((_, i) => (
          <motion.div
            key={i}
            className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
              i === currentSection ? 'bg-[#00c26e] w-12' : 'bg-gray-300 w-6'
            }`}
            onClick={() => scrollToSection(i)}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {[...Array(totalSections)].map((_, i) => (
          <motion.button
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i === currentSection ? 'bg-[#00c26e] shadow-lg' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => scrollToSection(i)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={containerRef}
        className="flex h-full overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <HeroSection onNext={scrollToNext} />
        <HealthAgentPanel />
        <DoctorAgentPanel />
        <PharmacyAgentPanel />
        <WellnessAgentPanel />
        <EmergencyPanel />
        <FinalCTAPanel onLogin={handleLogin} />
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;