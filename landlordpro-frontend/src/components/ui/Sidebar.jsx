// Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Building, Users, FileText, DollarSign, Settings, BrickWall } from 'lucide-react';

const ICONS = {
  Dashboard: Home,
  Users: Users,
  Properties: Building,
  Locals: BrickWall,
  Tenants: Users,
  Leases: FileText,
  Invoices: FileText,
  Payments: DollarSign,
  Expenses: DollarSign,
  Documents: FileText,
  Reports: FileText,
  Settings: Settings,
};

const Sidebar = ({ links, open, onClose }) => {
  const location = useLocation(); // Get current URL

  const isLinkActive = (linkPath) => {
    // exact match for root paths like Dashboard
    if (linkPath === '/admin' || linkPath === '/manager') {
      return location.pathname === linkPath;
    }
    // for nested pages, highlight if current path starts with linkPath
    return location.pathname.startsWith(linkPath);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 shadow-md z-40 transform transition-transform duration-300 w-64 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding */}
        <div className="p-6 text-2xl font-bold text-teal-700 dark:text-teal-300 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span>LandlordPro</span>
          <button
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          <ul className="flex flex-col">
            {links.map((link) => {
              const Icon = ICONS[link.label];
              const active = isLinkActive(link.path);

              return (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={`flex items-center gap-3 px-6 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-800 transition-all relative ${
                      active
                        ? 'bg-teal-100 dark:bg-gray-700 font-semibold before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-teal-600 dark:before:bg-teal-400'
                        : ''
                    }`}
                    onClick={onClose}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Version */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400">
          Version 1.0.0
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 lg:hidden z-30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
