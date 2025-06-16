import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Comments from './Comments';

const STATUSES = ['Todo', 'In Progress', 'Done'];

export default function TaskModal({ projectId, task, onClose, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'Todo',
    assignees: []
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        status: task.status || 'Todo',
        assignees: task.assignees || []
      });
      setAttachments(task.attachments || []);
    }
    fetchMembers();
    setEditedTask(task);
  }, [task]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to load project members');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (task) {
        await api.put(`/tasks/${task._id}`, form);
        toast.success('Task updated successfully');
      } else {
        await api.post(`/tasks/${projectId}`, form);
        toast.success('Task created successfully');
      }
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post(`/tasks/${task._id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAttachments([...attachments, ...response.data]);
      toast.success('Files uploaded successfully');
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      setForm(prev => ({ ...prev, status: newStatus }));
      toast.success('Task status updated');
      onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update task status');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Task Details'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Update task information' : 'View and manage task details'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editedTask.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter task title"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={editedTask.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter task description"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assignee
                    </label>
                    <select
                      id="assignee"
                      name="assignee"
                      value={editedTask.assignee || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                      <option value="">Unassigned</option>
                      {task.members?.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{task.title}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{task.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignee</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {task.assignee ? task.assignee.name : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onDelete(task._id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors"
                  >
                    Delete Task
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Edit Task
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Comments taskId={task._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 