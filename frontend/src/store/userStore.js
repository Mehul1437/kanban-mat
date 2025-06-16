import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')),
  token: localStorage.getItem('token'),
  setUser: (user, token) => {
    console.log('Setting user:', user); // Debug log
    console.log('Setting token:', token); // Debug log
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    console.log('Logging out user from store'); // Debug log
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useUserStore; 