import { AuthClient } from '@dfinity/auth-client';
import { useNavigate } from 'react-router-dom';

// Side Navigation Component
const Navbar = () => {
    const navigate = useNavigate();

    const logout = async () => {
        const client = await AuthClient.create();
        await client.logout();
        navigate('/');
    };

  const navItems = [
    {
      name: 'Chat',
      path: '/chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      name: 'Doctor',
      path: '/doctor',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Pharmacy',
      path: '/pharmacy',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      name: 'Wellness',
      path: '/wellness',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

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
                item.name === 'Chat' 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-stone-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <div className={`transition-colors duration-300 mr-4 ${
                item.name === 'Chat' 
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

export default Navbar;