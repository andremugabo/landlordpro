import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sun, Moon, Bell, LogOut, Settings, User, Menu } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getUnreadNotifications,
  markNotificationRead,
} from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../../assets/react.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const resolveAvatarUrl = (avatar) => {
  if (!avatar) return defaultAvatar;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads')) {
    const trimmedBase = API_BASE_URL.replace(/\/$/, '');
    return `${trimmedBase}${avatar}`;
  }
  return avatar;
};

const Topbar = ({ user, onLogout, onMenuClick }) => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef(null);

  const navigate = useNavigate();

  const displayName = useMemo(() => {
    return user?.full_name || user?.name || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const avatarUrl = useMemo(() => {
    return user?.avatar ? resolveAvatarUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=14B8A6&color=fff&rounded=true`;
  }, [user, displayName]);

  const goToProfile = () => {
    navigate('/profile');
  };

  // Persist theme preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Close dropdowns on outside click & ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await getUnreadNotifications();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      toast.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      // Optimistically update locally
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));

      // Persist to backend
      await Promise.all(notifications.map((notif) => markNotificationRead(notif.id)));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
      await markNotificationRead(id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 shadow-md flex items-center justify-between px-4 sm:px-6 z-20">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
          LandlordPro Dashboard
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        {/* Notifications */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-dropdown z-50">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Notifications
                </span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkRead(notif.id)}
                      className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 cursor-pointer ${
                        !notif.is_read ? 'bg-gray-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      {notif.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <img
              src={avatarUrl}
              alt={`${displayName} avatar`}
              className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultAvatar;
              }}
            />
            <span className="hidden sm:inline-block text-gray-800 dark:text-gray-200">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-dropdown">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email || 'Admin User'}
                </p>
              </div>

              <button  onClick={goToProfile} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <User className="w-4 h-4" /> Profile
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Settings className="w-4 h-4" /> Settings
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
