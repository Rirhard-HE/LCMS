import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth() || {};
  const navigate = useNavigate();
  const handleLogout = () => { logout?.(); navigate('/login'); };

  console.log('NAVBAR_MOUNT');

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-700 tracking-wide">LCMS</Link>
        <div className="flex items-center gap-8">
          {user ? (
            <>
              <NavItem to="/cases">Cases</NavItem>
              <NavItem to="/evidence">Evidence</NavItem>
              <NavItem to="/profile">Profile</NavItem> {/* ← 确保是 /profile */}
              <button onClick={handleLogout} className="ml-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavItem to="/login">Login</NavItem>
              <Link to="/register" className="px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
