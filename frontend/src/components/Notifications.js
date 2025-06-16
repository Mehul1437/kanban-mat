import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import useUserStore from '../store/userStore';

export default function Notifications() {
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(() => {
    api.get('/notifications').then(res => setNotifications(res.data));
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifications();
  };
  const del = async (id) => {
    await api.delete(`/notifications/${id}`);
    fetchNotifications();
  };

  if (!user) return null;
  return (
    <div>
      <div className="font-bold mb-2">Notifications</div>
      {notifications.length === 0 && <div className="text-gray-500">No notifications</div>}
      <ul className="space-y-2">
        {notifications.map(n => (
          <li key={n._id} className={`p-2 rounded ${n.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
            <div className="flex justify-between items-center">
              <span>{n.message}</span>
              <div className="flex gap-2">
                {!n.read && <button onClick={() => markRead(n._id)} className="text-xs text-blue-600 underline">Mark read</button>}
                <button onClick={() => del(n._id)} className="text-xs text-red-600 underline">Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 