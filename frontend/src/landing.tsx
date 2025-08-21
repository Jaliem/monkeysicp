import { useNavigate } from "react-router-dom";

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
      <section className="flex flex-col items-center text-center px-8 py-24 bg-gradient-to-b from-stone-50 via-white to-stone-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-300 rounded-full opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-emerald-300 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-15"></div>
        
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-6xl font-light text-stone-800 mb-8 leading-tight">
            Your health companion,{' '}
            <span className="relative">
              <span className="text-emerald-600">anywhere</span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-emerald-300 rounded-full opacity-60"></div>
            </span>
            ,{' '}
            <span className="relative">
              <span className="text-blue-600">anytime</span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-blue-300 rounded-full opacity-60"></div>
            </span>
            .
          </h1>
          
          <p className="text-xl text-stone-600 max-w-3xl mx-auto mb-6 font-light leading-relaxed">
            The future of healthcare — always available, personalized, and confidential.
          </p>
          
          <p className="text-stone-500 max-w-3xl mx-auto mb-12 font-light text-lg leading-relaxed">
            Built on{' '}
            <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              Fetch.ai 
            </span>{' '}
            and the{' '}
            <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
              Internet Computer (ICP)
            </span>
            , your private health agent is powered by Web3 to keep you in control of your data, while giving you intelligent support 24/7.
          </p>
          
          <button
            onClick={handleLogin}
            className="px-8 py-4 rounded-full bg-emerald-600 text-white text-xl font-medium hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Now
          </button>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-stone-800 mb-4">Why Choose Us</h2>
          <div className="w-24 h-1 bg-emerald-400 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <div className="group p-8 bg-stone-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-stone-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors duration-300">
              <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Always Available</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
              Access your health agent anytime, anywhere — no appointments, no waiting rooms.
            </p>
          </div>
          
          <div className="group p-8 bg-stone-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-stone-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Truly Personalized</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
              An agent that learns your needs, tracks your wellness, and adapts to you.
            </p>
          </div>
          
          <div className="group p-8 bg-stone-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-stone-100">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors duration-300">
              <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-4">Confidential</h3>
            <p className="text-stone-600 font-light leading-relaxed text-lg">
              Your health data is encrypted, decentralized in the ICP canister.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-8 py-20 bg-stone-800 text-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-emerald-600 rounded-full opacity-10"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-600 rounded-full opacity-15"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-white mb-4">How It Works</h2>
            <div className="w-24 h-1 bg-emerald-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-start space-x-6 group">
              <span className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-medium group-hover:bg-emerald-500 transition-colors duration-300">
                1
              </span>
              <p className="text-stone-200 font-light text-xl leading-relaxed pt-2">
                Sign up with your Internet Identity.
              </p>
            </div>
            
            <div className="flex items-start space-x-6 group">
              <span className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium group-hover:bg-blue-500 transition-colors duration-300">
                2
              </span>
              <p className="text-stone-200 font-light text-xl leading-relaxed pt-2">
                Set your preferences — your agent tailors recommendations around your goals.
              </p>
            </div>
            
            <div className="flex items-start space-x-6 group">
              <span className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-medium group-hover:bg-purple-500 transition-colors duration-300">
                3
              </span>
              <p className="text-stone-200 font-light text-xl leading-relaxed pt-2">
                Chat instantly with your healthcare agent — available 24/7.
              </p>
            </div>
            
            <div className="flex items-start space-x-6 group">
              <span className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-medium group-hover:bg-amber-500 transition-colors duration-300">
                4
              </span>
              <p className="text-stone-200 font-light text-xl leading-relaxed pt-2">
                Own your data — everything is private, portable, and under your control.
              </p>
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