import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const res = await api.post(url, payload);
      console.log('Login response:', res.data); // Debug log
      
      if (isLogin) {
        if (!res.data.user || !res.data.token) {
          throw new Error('Invalid response format from server');
        }
        setUser(res.data.user, res.data.token);
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
        setForm({ name: '', email: '', password: '' });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'An error occurred');
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setForm({ name: '', email: '', password: '' });
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {isLogin ? 'Create one' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 