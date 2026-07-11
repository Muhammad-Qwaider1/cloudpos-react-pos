import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('cloudpos_theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('cloudpos_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, setDark };
}