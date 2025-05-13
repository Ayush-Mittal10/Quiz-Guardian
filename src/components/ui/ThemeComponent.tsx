
import React, { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface BaseProps {
  children: ReactNode;
  className?: string;
}

interface ThemeProps extends BaseProps {
  variant?: 'primary' | 'secondary';
}

/**
 * Container component that applies theme styles consistently
 */
export const ThemeContainer: React.FC<ThemeProps> = ({ 
  children, 
  variant = 'primary',
  className
}) => {
  const theme = useTheme();
  
  return (
    <div className={cn(
      'container-theme',
      variant === 'primary' ? 'bg-theme-primary' : 'bg-theme-secondary',
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Section component with theme-consistent spacing
 */
export const ThemeSection: React.FC<ThemeProps> = ({ 
  children, 
  variant = 'primary',
  className
}) => {
  return (
    <section className={cn(
      variant === 'primary' ? 'bg-theme-primary' : 'bg-theme-secondary',
      className
    )}>
      <ThemeContainer>
        {children}
      </ThemeContainer>
    </section>
  );
};

/**
 * Text component that applies theme typography
 */
interface TextProps extends BaseProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'secondary';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const ThemeText: React.FC<TextProps> = ({
  children,
  variant = 'body',
  as = 'p',
  className
}) => {
  const Component = as;
  
  const textClasses = {
    h1: 'text-h1 font-bold text-theme-text',
    h2: 'text-h2 font-bold text-theme-text',
    h3: 'text-h3 font-bold text-theme-text',
    h4: 'text-h4 font-bold text-theme-text',
    body: 'text-body text-theme-text',
    secondary: 'text-body text-theme-text-secondary',
  };
  
  return (
    <Component className={cn(textClasses[variant], className)}>
      {children}
    </Component>
  );
};

export default {
  Container: ThemeContainer,
  Section: ThemeSection,
  Text: ThemeText
}; 
