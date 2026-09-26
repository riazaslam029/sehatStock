import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "primary",
  className,
}: StatCardProps) {
  const iconBgVariants: Record<string, string> = {
    primary: "bg-primary-subtle text-primary border-primary/20",
    secondary: "bg-secondary-subtle text-secondary border-secondary/20",
    success: "bg-success-subtle text-success border-success/20",
    warning: "bg-warning-subtle text-warning border-warning/20",
    danger: "bg-danger-subtle text-danger border-danger/20",
    info: "bg-info-subtle text-info border-info/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-card transition-all hover:shadow-elevated",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {title}
        </span>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border",
            iconBgVariants[variant]
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h4 className="text-2xl font-bold tracking-tight text-text">{value}</h4>
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.isPositive
                ? "bg-success-subtle text-success"
                : "bg-danger-subtle text-danger"
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
            )}
            {trend.value}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-text-muted font-normal">{subtitle}</p>
      )}
    </div>
  );
}
