import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import useUserStore from '../store/userStore';
import toast from 'react-hot-toast';

export default function ActivityLog({ projectId }) {
  const { user } = useUserStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/activity/${projectId}`);
      setLogs(response.data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      toast.error(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Activity Log</h2>
      {logs.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center py-4">No activity yet</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {logs.map(log => (
            <li key={log._id} className="p-3 rounded bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {log.user?.name || 'User'}
                  </span>{' '}
                  <span className="text-gray-600 dark:text-gray-300">{log.action}</span>
                  {log.details && (
                    <span className="text-gray-500 dark:text-gray-400">: {log.details}</span>
                  )}
                </div>
                {/* <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span> */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 