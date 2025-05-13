
import { toast as sonnerToast, type ToastT } from "sonner";

// Define types for our toast function
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
  duration?: number;
};

// Re-export toast for direct use
export const toast = sonnerToast;

// Provide a compatible hook for existing code
export function useToast() {
  return {
    toast: ({ title, description, variant = "default", action, duration }: ToastProps) => {
      if (variant === "destructive") {
        return sonnerToast.error(title || "", {
          description,
          action,
          duration
        });
      }
      return sonnerToast(title || "", {
        description,
        action,
        duration
      });
    }
  };
}
