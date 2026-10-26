import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const themeKey = 'karelio-theme';

function savedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(themeKey);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch { return null; }
}

export default function ThemeToggle() {
  const [preference, setPreference] = useState<Theme | null>(savedTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme: Theme = preference ?? (systemDark ? 'dark' : 'light');

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    try { window.localStorage.setItem(themeKey, next); } catch { /* Theme still works when storage is unavailable. */ }
  }

  const label = theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
  return (
    <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  );
}
