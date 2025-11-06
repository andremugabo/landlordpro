import React, { useEffect, useRef, useState } from 'react';
import { getUnreadNotifications, markNotificationRead } from '../../services/userService';
import { toast } from 'react-toastify';
import { Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      toast.info('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon button */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="font-medium text-gray-800 dark:text-gray-200">Notifications</span>
              {notifications.length > 0 && (
                <button
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    notifications.forEach((n) => handleMarkRead(n.id));
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm text-center">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                No unread notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
