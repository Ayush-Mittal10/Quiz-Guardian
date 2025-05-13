# Quizzly Theme System

This document outlines the theme system for the Quizzly application, providing guidance on how to maintain design consistency across the application.

## Color Palette

The color scheme is clean and professional, using neutral tones with a soft blue accent to convey trust, intelligence, and technology—ideal for an educational platform.

- **Primary Background (`#FFFFFF`)**: A crisp, clean base for the entire page.
- **Secondary Background (`#F8F9FA`)**: Used in alternating sections for subtle depth.
- **Accent Color (`#3498DB`)**: Applied to headings, icons, and highlights to draw attention.
- **Button Color (`#2980B9`)**: Used for buttons and interactive elements for strong contrast.
- **Text Color (`#2C3E50`)**: Primary text color for optimal readability.
- **Secondary Text Color (`#7F8C8D`)**: For less prominent text like descriptions or footnotes.

## Typography

A modern, sans-serif font ensures readability and a clean aesthetic.

- **Font Family**: 'Roboto', sans-serif
- **Headings**:
  - H1: 36px, Bold
  - H2: 28px, Bold
  - H3: 22px, Bold
  - H4: 18px, Bold
- **Body Text**: Roboto Regular, 16px
- **Button Text**: Roboto Medium, 14px

## Spacing and Layout

A responsive grid system ensures consistency and adaptability across devices.

- **Grid System**: 12-column grid for flexible, responsive design.
- **Section Padding**: 60px top and bottom for ample white space.
- **Content Width**: Maximum 1200px, centered.
- **Breakpoints**:
  - Mobile: 480px
  - Tablet: 768px
  - Desktop: 1024px
  - Wide: 1200px

## Usage in Components

### Tailwind Classes

We've extended Tailwind with theme-specific classes:

```jsx
// Background colors
<div className="bg-theme-primary">...</div>
<div className="bg-theme-secondary">...</div>

// Text colors
<p className="text-theme-text">...</p>
<p className="text-theme-text-secondary">...</p>

// Container with theme width
<div className="container-theme">...</div>

// Section with theme padding
<section className="py-section">...</section>
```

### Theme Components

For consistency, use the provided theme components:

```jsx
import { ThemeContainer, ThemeSection, ThemeText } from '@/components/ui/ThemeComponent';

// Container with theme styling
<ThemeContainer>
  Content goes here
</ThemeContainer>

// Section with theme styling
<ThemeSection variant="secondary">
  Content goes here
</ThemeSection>

// Text with theme styling
<ThemeText variant="h1">Heading</ThemeText>
<ThemeText variant="body">Regular text</ThemeText>
<ThemeText variant="secondary">Secondary text</ThemeText>
```

### Using the Theme Context

For programmatic access to theme values:

```jsx
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <div style={{ color: theme.colors.accent }}>
      Custom styling
    </div>
  );
};
```

## Button Variants

The Button component includes several theme-aligned variants:

```jsx
import { Button } from '@/components/ui/button';

// Primary button (default)
<Button>Default Button</Button>

// Accent button (lighter blue)
<Button variant="accent">Accent Button</Button>

// Secondary button
<Button variant="secondary">Secondary Button</Button>

// Outline button
<Button variant="outline">Outline Button</Button>

// Link button
<Button variant="link">Link Button</Button>
```

## Accessibility

The theme is designed with accessibility in mind:

- Color contrast ratios meet WCAG 2.1 AA guidelines
- Font sizes are readable and can be scaled
- Interactive elements have appropriate focus states

## Maintaining Consistency

When creating new components:

1. Use the existing theme colors and typography
2. Utilize the theme components where appropriate
3. Refer to this guide for spacing and layout guidelines
4. Follow the established design patterns

For questions about the theme system, contact the design team. 