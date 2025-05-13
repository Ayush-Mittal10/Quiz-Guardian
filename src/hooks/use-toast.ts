
import { toast as sonnerToast, type ToastT } from "sonner";

// Define types for our toast function
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  action?: React.ReactNode;
  duration?: number;
  id?: string;
};

// Re-export toast for direct use
export const toast = sonnerToast;

// Provide a compatible hook for existing code
export function useToast() {
  return {
    toast: ({ title, description, variant = "default", action, duration, id }: ToastProps) => {
      // Make sure we have valid content for the toast
      const validTitle = title || "";
      const validDescription = description || "";
      
      // Don't create empty toasts
      if (!validTitle && !validDescription) {
        return console.warn("Toast requires either title or description");
      }

      // Map variant to the appropriate toast type
      if (variant === "destructive") {
        return sonnerToast.error(validTitle, {
          description: validDescription,
          action,
          duration,
          id
        });
      } else if (variant === "success") {
        return sonnerToast.success(validTitle, {
          description: validDescription,
          action,
          duration,
          id
        });
      } else if (variant === "warning") {
        return sonnerToast.warning(validTitle, {
          description: validDescription,
          action,
          duration,
          id
        });
      } else if (variant === "info") {
        return sonnerToast.info(validTitle, {
          description: validDescription,
          action,
          duration,
          id
        });
      }
      
      // Default toast
      return sonnerToast(validTitle, {
        description: validDescription,
        action,
        duration,
        id
      });
    }
  };
}
