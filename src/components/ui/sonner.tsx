import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group fixed"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "group-[.toast]:font-semibold",
          info: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border",
          success: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border",
          warning: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border",
          error: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border",
          loader: "group-[.toast]:text-muted-foreground",
        },
        style: {
          position: 'fixed',
          zIndex: 100,
        },
      }}
      expand={true}
      closeButton={true}
      richColors={false}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from "sonner"
