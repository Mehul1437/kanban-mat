import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { UserPlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ProjectMembers({ projectId }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error(err.response?.data?.message || 'Failed to load project members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      const response = await api.post(`/projects/${projectId}/members`, { email: inviteEmail });
      if (response.data) {
        setMembers(response.data.members);
        toast.success('Member added successfully!');
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Error adding member:', err);
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
      if (response.data) {
        setMembers(response.data.members);
        toast.success('Member removed');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const getMemberStatus = (member) => {
    if (member.status === 'pending') return 'Pending Invitation';
    if (member.status === 'accepted') return 'Active Member';
    if (member.role === 'Owner') return 'Project Owner';
    return 'Unknown';
  };

  const getStatusColor = (member) => {
    if (member.status === 'pending') return 'text-yellow-600 dark:text-yellow-400';
    if (member.status === 'accepted') return 'text-green-600 dark:text-green-400';
    if (member.role === 'Owner') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Invite Form */}
      <form onSubmit={handleInvite} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email to invite"
            className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </form>

      {/* Members List */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No members yet</p>
        ) : (
          members.map((member) => (
            <div
              key={member.user._id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">
                    {(member.user.name || member.user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.user.name || member.user.email || 'Unknown User'}
                  </p>
                  <p className={`text-sm ${getStatusColor(member)}`}>
                    {getMemberStatus(member)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {member.status === 'accepted' && member.role !== 'Owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.user._id)}
                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove member"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 