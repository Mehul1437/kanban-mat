import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import useThemeStore from './store/themeStore';

function NotFound() {
  return <div className="flex items-center justify-center h-screen text-2xl">404 - Not Found</div>;
}

function DarkModeToggle() {
  const { dark, toggle } = useThemeStore();
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded shadow"
      aria-label="Toggle dark mode"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <DarkModeToggle />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
