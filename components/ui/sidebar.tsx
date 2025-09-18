import { cn } from "@/lib/utils";

export function SidebarMenuButton({
  children,
  className,
  asChild = false,
  isActive = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  isActive?: boolean;
}) {
  if (asChild) {
    return <>{children}</>;
  }
  
  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent w-full text-left",
        isActive && "bg-accent",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}