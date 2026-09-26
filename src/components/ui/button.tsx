import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const variants: Record<string, string> = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-subtle",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active shadow-subtle",
      outline:
        "border border-border bg-surface hover:bg-surface-muted text-text hover:text-text shadow-subtle",
      ghost:
        "text-text hover:bg-surface-muted hover:text-text",
      danger:
        "bg-danger text-danger-foreground hover:opacity-90 active:opacity-100 shadow-subtle",
      success:
        "bg-success text-success-foreground hover:opacity-90 active:opacity-100 shadow-subtle",
      subtle:
        "bg-primary-subtle text-primary hover:bg-opacity-80 active:bg-opacity-100",
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-10 px-4 text-sm rounded-md gap-2",
      lg: "h-11 px-5 text-base rounded-lg gap-2.5",
      icon: "h-9 w-9 rounded-md justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
