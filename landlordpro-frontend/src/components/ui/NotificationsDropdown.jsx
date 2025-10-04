import React, { useEffect, useState } from 'react';
import { getUnreadNotifications, markNotificationRead } from '../../services/userService';
import { toast } from 'react-toastify';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadNotifications();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(prev => prev - 1);
      toast.success('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="relative">
      <button className="relative">
        Notifications
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-3 text-gray-500 text-sm">No unread notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleMarkRead(n.id)}
            >
              {n.message}
              <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
