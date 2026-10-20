import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Car,
  ChevronRight,
  ClipboardCheck,
  Download,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Users2,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/', label: 'Manage Users', icon: Users2 },
  { to: '/api-credits', label: 'Vehicle API Sales', icon: Wallet },
  { to: '/api-keys', label: 'Vehicle API Keys', icon: KeyRound, matchPrefix: true },
  { to: '/fitness-work', label: 'Fitness Work', icon: ClipboardCheck },
];

// Less used pages, tucked away behind the "More" arrow
const MORE_ITEMS = [
  { to: '/blogs', label: 'Manage Blogs', icon: Newspaper },
  { to: '/vehicle-registrations', label: 'Vehicle Registrations', icon: Car },
  { to: '/export', label: 'Export Data', icon: Download },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isOnMorePage = MORE_ITEMS.some((item) => item.to === location.pathname);
  const [showMore, setShowMore] = useState(false);
  // Keep the group open while one of its pages is showing
  const moreOpen = showMore || isOnMorePage;

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  const renderLink = (item) => {
    const active = item.matchPrefix ? location.pathname.startsWith(item.to) : location.pathname === item.to;
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={handleLinkClick}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky md:top-0 inset-y-0 left-0 z-50 md:h-screen
          w-60 flex flex-col gap-6 border-r border-stone-200 bg-[#fbfaf7] p-4 md:p-5
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900">
              <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-stone-900">RTO Sarthi</p>
              <p className="text-xs text-stone-500">Admin Panel</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2 overflow-y-auto" aria-label="Admin navigation">
          {NAV_ITEMS.map(renderLink)}

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            disabled={isOnMorePage}
            aria-expanded={moreOpen}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
          >
            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${moreOpen ? 'rotate-90' : ''}`} />
            {moreOpen ? 'Less' : 'More'}
          </button>

          {moreOpen && (
            <div className="ml-3 flex flex-col gap-2 border-l border-stone-200 pl-2">
              {MORE_ITEMS.map(renderLink)}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
