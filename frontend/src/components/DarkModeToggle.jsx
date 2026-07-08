import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(() => {
    // Check local storage or browser preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      return media.matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
      aria-label="Theme Toggle Button"
    >
      {theme === 'dark' ? <Sun size={20} style={{ color: '#fbbf24' }} /> : <Moon size={20} />}
    </button>
  );
}
