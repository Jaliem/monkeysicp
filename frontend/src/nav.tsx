import { AuthClient } from '@dfinity/auth-client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from './hooks/useAdmin';
import logo from './assets/logo.png';

// Side Navigation Component
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAdmin();

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

  // Admin navigation items (only visible to admins)
  const adminNavItems = [
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      name: 'Manage Records',
      path: '/admin2',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      )
    },
    {
      name: 'User Activity',
      path: '/admin3',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Combine regular nav items with admin items if user is admin
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <nav className="w-64 h-screen bg-white shadow-xl border-r border-stone-200 flex flex-col font-serif">
      {/* Logo Section */}
      <div className="p-8 border-b border-stone-100">
        <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')}
              className='flex flex-row items-center hover:opacity-80 transition-opacity duration-200 cursor-pointer'
            >
            <img src={logo} alt="Logo" className='h-10 w-10 mr-2'/>
            <div>
              <div className="text-2xl font-light text-emerald-700 tracking-wide">
              Cura.
            </div>
            </div>
          </button>
          
          {/* Notification Bell */}
          <button
            onClick={() => navigate('/reminders')}
            className="relative p-2 hover: rounded-lg transition-colors duration-200 group"
          >
            <svg 
              className="w-6 h-6 text-stone-400 group-hover:text-emerald-600 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M10 2a2 2 0 012 2v1.5a7.5 7.5 0 017.5 7.5v1.87l1.65 3.52A1 1 0 0120.15 20H3.85a1 1 0 01-.9-1.45L4.5 15.37V12a7.5 7.5 0 017.5-7.5V4a2 2 0 012-2zm4 18a2 2 0 01-4 0"
              />
            </svg>
            
         
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-8">
        <div className="space-y-2 px-4">
          {/* Regular Navigation Items */}
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
          
          {/* Admin Section Separator */}
          {isAdmin && (
            <>
              <div className="mx-6 my-6 border-t border-stone-200"></div>
              <div className="px-6 pb-2">
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              
              {/* Admin Navigation Items */}
              {adminNavItems.map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className={`group flex items-center px-6 py-4 rounded-xl transition-all duration-300 font-light text-lg ${
                    location.pathname === item.path
                      ? 'text-red-600 bg-red-50' 
                      : 'text-stone-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <div className={`transition-colors duration-300 mr-4 ${
                    location.pathname === item.path
                      ? 'text-red-600' 
                      : 'text-stone-400 group-hover:text-red-600'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    {item.name}
                  </span>
                </a>
              ))}
            </>
          )}
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