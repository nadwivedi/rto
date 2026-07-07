import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const theme = getTheme();

  const handleDropdownEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 2, // Small gap
      right: window.innerWidth - rect.right - 40, // Shift 40px more to the right
    });
    setIsDropdownOpen(true);
  };

  const menuItems = [
    {
      name: "",
      icon: "📊",
      path: "/",
      description: "Overview & Expiring Items",
    },
    {
      name: "Vehicle +",
      icon: "🚗",
      path: "/vehicle-registration",
      description: "Register Vehicles",
    },

    {
      name: "NP",
      icon: "🛣️",
      path: "/national-permit",
      description: "National Permits",
    },
    {
      name: "CG Permit",
      icon: "📄",
      path: "/cg-permit",
      description: "CG State Permits",
    },
    {
      name: "Bus Permit",
      icon: "🚌",
      path: "/bus-permit",
      description: "Bus Permits",
    },
    {
      name: "Temp Permit",
      icon: "⏰",
      path: "/temporary-permit",
      description: "Temporary Permits",
    },
    {
      name: "Temp Permit (Oth State)",
      icon: "🚗",
      path: "/temporary-permit-other-state",
      description: "Temporary Permits from Other States",
    },

    {
      name: "Fitness",
      icon: "✅",
      path: "/fitness",
      description: "Fitness Certificate",
    },
    {
      name: "Tax",
      icon: "💰",
      path: "/tax",
      description: "Tax Management",
    },
    {
      name: "PUC",
      icon: "💨",
      path: "/puc",
      description: "Pollution Certificate",
    },
    {
      name: "GPS",
      icon: "📍",
      path: "/gps",
      description: "GPS Tracking",
    },

    {
      name: "Insurance",
      icon: "🛡️",
      path: "/insurance",
      description: "Vehicle Insurance",
    },
    {
      name: "Insurance Reports",
      icon: "📊",
      path: "/insurance/reports",
      description: "Monthly Business Report",
    },

     {
      name: "Bill",
      icon: "📈",
      path: "/dealer-bill",
      description: "Dealer Billing",
    },

    {
      name: "DL",
      icon: "🪪",
      path: "/driving",
      description: "DL Applications",
    },

{
      name: "Transfer",
      icon: "🔀",
      path: "/vehicle-transfer",
      description: "Transfer Ownership",
    },
    {
      name: "NOC",
      icon: "N",
      path: "/noc",
      description: "No Objection Certificate",
    },

     {
       name: "Forms",
      icon: "📋",
      path: "/forms",
      description: "RTO Forms",
    },

     {
       name: "Speed Gov",
       icon: "⚡",
       path: "/speed-governor",
       description: "Speed Governor Records",
     },

     {
       name: "Cashflow",
       icon: "💰",
       path: "/cashflow-report",
       description: "Expense & Income Report",
     },

    {
      name: "setting",
      icon: "⚙️",
      path: "/setting",
      description: "App Settings",
    },
  ];

// Dropdown items for desktop (Dashboard, Forms, Settings, Registration Renewal)
    const dropdownItems = [
    {
      name: "Home",
      icon: "🏠",
      path: "/",
      description: "Main Menu",
    },
    {
      name: "Vahan",
      icon: "🚚",
      path: "/vahan",
      description: "Vehicle Services",
    },
    {
      name: "Speed Gov",
      icon: "⚡",
      path: "/speed-governor",
      description: "Speed Governor Records",
    },
    {
      name: "Sarthi",
      icon: "🚗",
      path: "/sarthi",
      description: "Driving License Services",
    },
    {
      name: "NOC",
      icon: "N",
      path: "/noc",
      description: "No Objection Certificate",
    },
    {
      name: "Registration Renewal",
      icon: "🔄",
      path: "/registration-renewal",
      description: "Vehicle Registration Renewal",
    },
    {
      name: "Forms",
      icon: "📋",
      path: "/forms",
      description: "RTO Forms",
    },
    {
      name: "WhatsApp",
      icon: "💬",
      path: "/whatsapp",
      description: "Automated Messaging",
    },
    {
      name: "WhatsApp",
      icon: "💬",
      path: "/whatsapp",
      description: "Automated Messaging",
    },
    {
      name: "setting",
      icon: "⚙️",
      path: "/setting",
      description: "App Settings",
    },
  ];

  // Desktop menu items (all except Dashboard, Forms and Settings)
  // Filter out restricted items for staff
  let filteredMenuItems = menuItems;
  let filteredDropdownItems = dropdownItems;
  
  if (user?.type === 'staff') {
    filteredMenuItems = menuItems.filter(item => 
      !['Forms', 'whatsapp'].includes(item.name) && !['/forms', '/whatsapp'].includes(item.path)
    );
    filteredDropdownItems = dropdownItems.filter(item => 
      !['Forms', 'whatsapp'].includes(item.name) && !['/forms', '/whatsapp'].includes(item.path)
    );
  }

  // Desktop menu items (all except Dashboard, Forms and Settings)
  const desktopMenuItems = filteredMenuItems.filter(
    (item) => item.path !== "/" && item.path !== "/forms" && item.path !== "/setting" && item.path !== "/noc"
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header - Only visible on mobile */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 ${theme.navbar} text-white shadow-lg z-50`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-lg font-black text-white">R</span>
            </div>
            <h1 className="text-sm font-bold text-white">RTO Sarthi</h1>
          </div>

          {/* Home Button */}
          <Link
            to="/"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white transform transition-transform duration-300 ease-in-out z-50 w-64 shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="p-4 border-b border-purple-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-white">R</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white">RTO Sarthi</h1>
                <p className="text-xs text-purple-300 font-medium">
                  Your RTO Companion
                </p>
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-purple-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <nav className="p-3 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 shadow-lg"
                  : "hover:bg-white/10 hover:border border-transparent hover:border-purple-400/20"
              }`}
            >
              <span
                className={`text-xl ${
                  isActive(item.path)
                    ? "text-orange-300"
                    : "text-purple-200 group-hover:text-orange-300"
                }`}
              >
                {item.icon}
              </span>
              <div className="flex-1">
                <div
                  className={`text-sm font-semibold ${
                    isActive(item.path)
                      ? "text-white"
                      : "text-purple-100 group-hover:text-white"
                  }`}
                >
                  {item.name}
                </div>
                <div className="text-xs text-purple-400 group-hover:text-purple-300">
                  {item.description}
                </div>
              </div>
              {isActive(item.path) && (
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop Navbar - Only visible on desktop */}
      <nav className={`hidden lg:block fixed top-0 left-0 right-0 ${theme.navbar} text-white shadow-2xl z-50`}>
        <div className="px-3 2xl:px-4 py-2 2xl:py-3">
          {/* Menu Items - Horizontal with responsive sizing */}
          <div className="flex items-center gap-1.5 2xl:gap-2.5 overflow-x-auto scrollbar-hide">
            {/* Home Button */}
            <Link
              to="/"
              className={`flex items-center gap-1.5 2xl:gap-2 px-1.5 2xl:px-2.5 py-1.5 2xl:py-2 rounded-lg transition-all duration-200 group flex-shrink-0 ${
                location.pathname === "/"
                  ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 shadow-lg"
                  : "hover:bg-white/10 hover:border border-transparent hover:border-purple-400/20"
              }`}
              title="Home"
            >
              <span className={`text-base 2xl:text-lg ${
                location.pathname === "/" ? "text-orange-300" : "text-purple-200 group-hover:text-orange-300"
              }`}>
                <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
            </Link>

            {desktopMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 2xl:gap-2 px-1.5 2xl:px-2.5 py-1.5 2xl:py-2 rounded-lg transition-all duration-200 group flex-shrink-0 ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 shadow-lg"
                    : "hover:bg-white/10 hover:border border-transparent hover:border-purple-400/20"
                }`}
                title={item.description}
              >
                <span
                  className={`text-base 2xl:text-lg ${
                    isActive(item.path)
                      ? "text-orange-300"
                      : "text-purple-200 group-hover:text-orange-300"
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-xs 2xl:text-sm font-semibold whitespace-nowrap ${
                    isActive(item.path)
                      ? "text-purple-100"
                      : "text-purple-100 group-hover:text-white"
                  }`}
                >
                  <span className="hidden 2xl:inline">{item.name}</span>
                  <span className="2xl:hidden">
                    {item.name === "Vehicle Registration" ? "Vehicle Reg." :
                     item.name === "Driving Licence" ? "DL" :
                     item.name}
                  </span>
                </span>
                {isActive(item.path) && (
                  <div className="w-1 2xl:w-1.5 h-1 2xl:h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}

            {/* Dropdown Menu */}
            <div
              className="relative flex-shrink-0"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={() => {
                console.log("Mouse left dropdown area");
                setIsDropdownOpen(false);
              }}
            >
              {/* Dropdown Trigger - Downward Arrow */}
              <button
                className={`flex items-center justify-center px-2 2xl:px-3 py-1.5 2xl:py-2 rounded-lg transition-all duration-200 border ${
                  isDropdownOpen
                    ? "bg-white/10 border-purple-400/20"
                    : "hover:bg-white/10 border-transparent hover:border-purple-400/20"
                }`}
                title="More Options"
                type="button"
              >
                <svg
                  className={`w-4 h-4 2xl:w-5 2xl:h-5 transition-colors ${
                    isDropdownOpen
                      ? "text-orange-300"
                      : "text-purple-200 hover:text-orange-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dropdown Content - Fixed positioning outside overflow container */}
      {isDropdownOpen && (
        <div
          className="fixed z-[100]"
          style={{
            top: `${dropdownPosition.top - 4}px`,
            right: `${dropdownPosition.right}px`,
          }}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          {/* Invisible bridge to prevent dropdown from closing */}
          <div className="h-2 w-full"></div>

          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-lg shadow-2xl border border-purple-400/20 w-[150px] overflow-hidden">
            {filteredDropdownItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsDropdownOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 transition-all duration-200 group/item ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-l-4 border-orange-400"
                    : "hover:bg-white/10 border-l-4 border-transparent hover:border-purple-400/40"
                }`}
              >
                <span
                  className={`text-base ${
                    isActive(item.path)
                      ? "text-orange-300"
                      : "text-purple-200 group-hover/item:text-orange-300"
                  }`}
                >
                  {item.icon}
                </span>
                <div className="flex-1">
                  <div
                    className={`text-xs font-semibold ${
                      isActive(item.path)
                        ? "text-white"
                        : "text-purple-100 group-hover/item:text-white"
                    }`}
                  >
                    {item.name}
                  </div>
                  <div className="text-[10px] text-purple-400 group-hover/item:text-purple-300">
                    {item.description}
                  </div>
                </div>
                {isActive(item.path) && (
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;




