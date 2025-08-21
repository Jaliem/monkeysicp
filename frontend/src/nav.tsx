import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center text-blue-600 font-bold text-xl">
            HealthAgent
          </div>

          {/* Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/chat" className="text-gray-700 hover:text-blue-600 font-medium">
              Chat
            </Link>
            <Link to="/pharmacy" className="text-gray-700 hover:text-blue-600 font-medium">
              Pharmacy
            </Link>
            <Link to="/doctor" className="text-gray-700 hover:text-blue-600 font-medium">
              Doctor
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-700 hover:text-blue-600 focus:outline-none">
              ☰
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
