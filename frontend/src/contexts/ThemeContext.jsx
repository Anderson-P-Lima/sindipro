import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Recupera do localStorage ou usa 'light' como padrão
    return localStorage.getItem('@sindipro:theme') || 'light';
  });

  useEffect(() => {
    // Aplica o atributo no HTML (Bootstrap 5.3 usa isso para o Dark Mode nativo)
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('@sindipro:theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}