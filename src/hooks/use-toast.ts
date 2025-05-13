import { toast as sonnerToast } from "sonner";

// Re-export toast for direct use
export const toast = sonnerToast;

// Provide a compatible hook for existing code
export function useToast() {
  return {
    toast: (options: any) => {
      const { title, description, variant } = options;
      if (variant === "destructive") {
        return sonnerToast.error(title, {
          description
        });
      }
      return sonnerToast(title, {
        description
      });
    }
  };
}
