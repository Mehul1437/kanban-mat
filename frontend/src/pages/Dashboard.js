import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import useThemeStore from '../store/themeStore';
import useUserStore from '../store/userStore';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { dark } = useThemeStore();
  const { user, logout } = useUserStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    console.log('Current user:', user);
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    fetchProjects();
  }, [user, navigate]);

  const fetchProjects = async () => {
    try {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      console.log('Fetching projects for user:', user.id);
      const response = await api.get('/projects');
      console.log('Projects response:', response.data);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        logout();
        toast.error('Session expired. Please login again.');
        navigate('/auth');
      } else {
        toast.error('Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to fetch projects when user changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchProjects();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        toast.error('User information not found. Please login again.');
        navigate('/auth');
        return;
      }

      const projectData = {
        name: newProject.name,
        description: newProject.description,
        startDate: newProject.startDate,
        endDate: newProject.endDate
      };

      console.log('Creating project with data:', projectData);

      const response = await api.post('/projects', projectData);
      console.log('Project creation response:', response.data);
      
      // Fetch updated projects list after creating new project
      const updatedProjects = await api.get('/projects');
      setProjects(updatedProjects.data);
      
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', startDate: '', endDate: '' });
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error.response?.data || error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create project');
      }
    }
  };

  const handleLogout = () => {
    console.log('Logging out user');
    logout();
    setIsLogoutModalOpen(false);
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your projects and tasks</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new project.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      {project.startDate && (
                        <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div>
                      {project.endDate && (
                        <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirm Logout</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to logout? You will need to login again to access your projects.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newProject.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newProject.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter project description"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={newProject.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={newProject.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 