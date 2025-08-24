import { AuthClient } from '@dfinity/auth-client';
import { useNavigate, useLocation } from 'react-router-dom';

// Side Navigation Component
const NavbarAdmin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const logout = async () => {
        const client = await AuthClient.create();
        await client.logout();
        navigate('/');
    };

  const navItems = [
    {
      name: 'Manage Records',
      path: '/admin2',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'Add Records',
      path: '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
  ]

  return (
    <nav className="w-64 h-screen bg-white shadow-xl border-r border-stone-200 flex flex-col font-serif">
      {/* Logo Section */}
      <div className="p-8 border-b border-stone-100">
        <div className="text-3xl font-light text-emerald-700 tracking-wide">
          Cura.
        </div>
        <div className="w-12 h-1 bg-emerald-400 mt-2 rounded-full"></div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-8">
        <div className="space-y-2 px-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className={`group flex items-center px-6 py-4 rounded-xl transition-all duration-300 font-light text-lg ${
                location.pathname === item.path
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-stone-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <div className={`transition-colors duration-300 mr-4 ${
                location.pathname === item.path
                  ? 'text-emerald-600' 
                  : 'text-stone-400 group-hover:text-emerald-600'
              }`}>
                {item.icon}
              </div>
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                {item.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-stone-100">
        <button
          onClick={logout}
          className="w-full flex items-center px-6 py-4 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-light text-lg group"
        >
          <div className="text-stone-400 group-hover:text-red-600 transition-colors duration-300 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="group-hover:translate-x-1 transition-transform duration-300">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
};

export default NavbarAdmin;