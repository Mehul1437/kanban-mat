import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusIcon, UserGroupIcon, BellIcon, ClockIcon, UserCircleIcon, XMarkIcon, ArrowLeftIcon, UserPlusIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import ProjectMembers from '../components/ProjectMembers';
import Notifications from '../components/Notifications';
import ActivityLog from '../components/ActivityLog';
import Comments from '../components/Comments';
import toast from 'react-hot-toast';

const COLUMNS = {
  Todo: {
    id: 'Todo',
    title: 'To Do',
    items: []
  },
  'In Progress': {
    id: 'In Progress',
    title: 'In Progress',
    items: []
  },
  Done: {
    id: 'Done',
    title: 'Done',
    items: []
  }
};

export default function ProjectPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState({
    Todo: { items: [] },
    'In Progress': { items: [] },
    Done: { items: [] }
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

  const fetchTasksAndMembers = useCallback(async () => {
    if (!projectId) {
      setError('Project ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await api.get(`/projects/${projectId}`);
      if (!projectResponse.data) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProject(projectResponse.data);

      // Fetch tasks
      const tasksResponse = await api.get(`/tasks/${projectId}`);
      const tasks = tasksResponse.data || [];

      // Initialize columns with empty arrays
      const newColumns = { ...COLUMNS };
      Object.keys(newColumns).forEach(key => {
        newColumns[key].items = [];
      });

      // Sort tasks into columns
      tasks.forEach(task => {
        const status = task.status || 'Todo';
        if (newColumns[status]) {
          newColumns[status].items.push({
            ...task,
            _id: task._id.toString(),
            id: task._id.toString()
          });
        }
      });

      setColumns(newColumns);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.response?.data?.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasksAndMembers();
  }, [fetchTasksAndMembers]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = (updatedTask) => {
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      
      // Remove task from all columns
      Object.keys(newColumns).forEach(key => {
        newColumns[key].items = newColumns[key].items.filter(t => t._id !== updatedTask._id);
      });

      // Add task to the correct column
      if (newColumns[updatedTask.status]) {
        newColumns[updatedTask.status].items.push({
          ...updatedTask,
          _id: updatedTask._id.toString(),
          id: updatedTask._id.toString()
        });
      }

      return newColumns;
    });
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskId) => {
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      Object.keys(newColumns).forEach(key => {
        newColumns[key].items = newColumns[key].items.filter(t => t._id !== taskId);
      });
      return newColumns;
    });
    setSelectedTask(null);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const task = Object.values(columns)
      .flatMap(col => col.items)
      .find(t => t._id === draggableId);
    
    if (!task) return;

    const newStatus = destination.droppableId;
    try {
      const response = await api.put(`/tasks/${projectId}/${draggableId}`, {
        ...task,
        status: newStatus
      });
      
      handleTaskUpdate(response.data);
      toast.success('Task status updated');
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members/invites/${inviteId}/accept`);
      if (response.data) {
        // Refresh members list
        const updatedProject = await api.get(`/projects/${projectId}`);
        setProject(updatedProject.data);
        setMembers(updatedProject.data.members);
        toast.success('Invitation accepted successfully');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members/invites/${inviteId}/reject`);
      if (response.data) {
        // Refresh members list
        const updatedProject = await api.get(`/projects/${projectId}`);
        setProject(updatedProject.data);
        setMembers(updatedProject.data.members);
        toast.success('Invitation rejected successfully');
      }
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to reject invitation');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/projects/${projectId}/members`, { email: inviteEmail });
      if (response.data) {
        // Refresh members list
        const updatedProject = await api.get(`/projects/${projectId}`);
        setProject(updatedProject.data);
        setMembers(updatedProject.data.members);
        setInviteEmail('');
        setShowInviteModal(false);
        toast.success('Invitation sent successfully');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, {
        ...taskData,
        status: 'Todo'
      });

      if (response.data) {
        const newTask = {
          ...response.data,
          id: response.data._id,
          status: 'Todo'
        };

        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          newColumns.Todo.items = [...newColumns.Todo.items, newTask];
          return newColumns;
        });

        setShowNewTaskModal(false);
        toast.success('Task created successfully');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch activities');
    }
  };

  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (isActivityOpen) {
      fetchActivities();
    }
  }, [isActivityOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-500 mb-4">Project not found</div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{project?.description}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Task
              </button>
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <BellIcon className="h-5 w-5 mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setIsActivityOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                Activity
              </button>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Members
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Kanban Board */}
          <div className={`${showNotifications || showActivity ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(columns).map(([columnId, column]) => (
                    <div key={columnId} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {columnId} ({column.items.length})
                        </h3>
                      </div>
                      <Droppable droppableId={columnId} type="TASK">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-4 min-h-[200px] ${
                              snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-700' : ''
                            }`}
                          >
                            {column.items.map((task, index) => (
                              <Draggable 
                                key={task.id} 
                                draggableId={task.id} 
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleTaskClick(task)}
                                    className={`mb-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : ''
                                    }`}
                                  >
                                    <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                                    {task.assignee && (
                                      <div className="mt-2 flex items-center">
                                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                          {task.assignee.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            )}
          </div>

          {/* Sidebar */}
          {(showNotifications || showActivity) && (
            <div className="lg:col-span-1 space-y-6">
              {showNotifications && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="p-4">
                    <Notifications />
                  </div>
                </div>
              )}

              {showActivity && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Log</h3>
                  </div>
                  <div className="p-4">
                    <ActivityLog projectId={projectId} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          open={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
          }}
          task={selectedTask}
          projectId={projectId}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Members</h3>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <ProjectMembers projectId={projectId} />
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Invite Member</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Invite a new member to your project
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleInviteSubmit(e);
              }} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="Enter email address"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full transform transition-all">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add a new task to your project
                  </p>
                </div>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateTask({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  dueDate: formData.get('dueDate'),
                  assignee: formData.get('assignee')
                });
              }} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="Enter task title"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Enter task description"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                {/* Due Date and Assignee in a grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Due Date */}
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>

                  {/* Assignee */}
                  <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assignee
                    </label>
                    <select
                      id="assignee"
                      name="assignee"
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member._id} value={member.user._id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Notifications</h2>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {notifications.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notifications yet</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {notification.type === 'success' && (
                          <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        )}
                        {notification.type === 'error' && (
                          <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                        )}
                        {notification.type === 'info' && (
                          <InformationCircleIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {isActivityOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Activity</h2>
              <button
                onClick={() => setIsActivityOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {activities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.user?.name || 'User'}
                          {/* {activity.description} */}
                        </p>{' '}
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 