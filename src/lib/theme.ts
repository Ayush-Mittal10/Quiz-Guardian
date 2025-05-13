/**
 * Central theme configuration for the Quizzly application
 * Teen-focused theme
 */

export const theme = {
  // Color palette
  colors: {
    // Primary theme colors
    peach: '#FFAB91', // Soft Peach - warm headings and highlights
    teal: '#4DB6AC',  // Calm Teal - cool accents for icons and buttons
    orange: '#FFB83D', // Sunny Orange - sparingly used for CTAs
    lavender: '#B39DDB', // Subtle Lavender - creative touches in backgrounds
    navy: '#1A1A3D',  // Deep Navy - strong text and footer color
    gray: '#F5F5F5',  // Light Gray - clean section backgrounds
    white: '#FFFFFF', // White - for card backgrounds

    // For backward compatibility
    primary: '#F5F5F5',   // Light Gray as primary background
    secondary: '#FFFFFF', // White as secondary background
    accent: '#4DB6AC',    // Teal as accent
    button: '#4DB6AC',    // Teal as primary button
    text: '#1A1A3D',      // Navy as text
    textSecondary: '#666666', // Secondary text
  },

  // Typography
  typography: {
    fontFamily: {
      heading: "'Poppins', sans-serif",
      body: "'Inter', sans-serif",
      accent: "'Caveat', cursive",
    },
    fontSize: {
      h1: '42px',
      h2: '32px',
      h3: '24px',
      h4: '20px',
      body: '16px',
      small: '14px',
      accent: '20px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Spacing and Layout
  spacing: {
    section: '80px', // Section padding
    containerMaxWidth: '1200px',
  },

  // Breakpoints
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px',
  },

  // Shadows and effects
  effects: {
    borderRadius: '0.75rem',
    shadow: {
      card: '0 4px 15px rgba(0, 0, 0, 0.05)',
      hover: '0 10px 25px rgba(77, 182, 172, 0.15)',
    },
    transition: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
    gradients: {
      peachToLavender: 'linear-gradient(to right, #FFAB91, #B39DDB)',
      tealToNavy: 'linear-gradient(to bottom, #4DB6AC, #1A1A3D)',
    }
  }
};

/**
 * Convert hex color to RGB values
 * Useful for creating rgba() colors with transparency
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Create an rgba color string from hex and alpha value
 */
export function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export default theme; 