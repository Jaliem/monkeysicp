import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <div className="text-2xl font-bold text-blue-600">HealthAgent</div>
        <nav>
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your health companion, anywhere, anytime.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-4">
          The future of healthcare — always available, personalized, and confidential.
        </p>
        <p className="text-gray-500 max-w-2xl mb-8">
          Built on <span className="font-semibold text-blue-600">Fetch.ai Agentverse</span> and the <span className="font-semibold text-purple-600">Internet Computer (ICP)</span>, your private health agent is powered by Web3 to keep you in control of your data, while giving you intelligent support 24/7.
        </p>
        <button
          onClick={handleLogin}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition"
        >
          Start Now
        </button>
      </section>

      {/* Why Choose Us */}
      <section className="px-6 py-16 bg-white">
        <h2 className="text-2xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Always Available</h3>
            <p className="text-gray-600">
              Access your health agent anytime, anywhere — no appointments, no waiting rooms.
            </p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Truly Personalized</h3>
            <p className="text-gray-600">
              An agent that learns your needs, tracks your wellness, and adapts to you.
            </p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confidential</h3>
            <p className="text-gray-600">
              Your health data is encrypted, decentralized in the ICP canister.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-gray-50">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-start space-x-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">1</span>
            <p className="text-gray-700">Sign up with your Internet Identity.</p>
          </div>
          <div className="flex items-start space-x-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">2</span>
            <p className="text-gray-700">Set your preferences — your agent tailors recommendations around your goals.</p>
          </div>
          <div className="flex items-start space-x-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">3</span>
            <p className="text-gray-700">Chat instantly with your healthcare agent — available 24/7.</p>
          </div>
          <div className="flex items-start space-x-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">4</span>
            <p className="text-gray-700">Own your data — everything is private, portable, and under your control.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
