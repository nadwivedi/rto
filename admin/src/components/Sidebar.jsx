import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-52 bg-indigo-900 text-white
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-indigo-700 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">RTO Sarthi</h1>
            <p className="text-[11px] text-indigo-300 mt-0.5">Admin Panel</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-indigo-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1.5">
          <Link
            to="/"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === '/'
                ? 'bg-white text-indigo-800 font-bold'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="truncate">Manage Users</span>
          </Link>

          <Link
            to="/blogs"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === '/blogs'
                ? 'bg-white text-indigo-800 font-bold'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="truncate">Manage Blogs</span>
          </Link>

          <Link
            to="/vehicle-registrations"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === '/vehicle-registrations'
                ? 'bg-white text-indigo-800 font-bold'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">Vehicle Registrations</span>
          </Link>

          <Link
            to="/create-vehicle-json"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === '/create-vehicle-json'
                ? 'bg-white text-indigo-800 font-bold'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="truncate">Create Vehicle (JSON)</span>
          </Link>

          <Link
            to="/export"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === '/export'
                ? 'bg-white text-indigo-800 font-bold'
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="truncate">Export Data</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
