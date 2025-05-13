import React, { createContext, useContext, ReactNode } from 'react';
import theme from '@/lib/theme';

// Create the context with the theme object
const ThemeContext = createContext(theme);

// Hook for components to easily access theme values
export const useTheme = () => useContext(ThemeContext);

// Provider component to wrap the application
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 