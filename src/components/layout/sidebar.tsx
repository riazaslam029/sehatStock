"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_CONFIG, NAVIGATION_SECTIONS } from "@/lib/constants";
import { Stethoscope, ShieldCheck, UserCheck } from "lucide-react";

interface SidebarProps {
  className?: string;
  user?: {
    name: string;
    role: "OWNER" | "STAFF";
    email: string;
  } | null;
}

export function Sidebar({ className, user }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = user?.role || "OWNER";
  const userName = user?.name || "Dr. Hamza Malik";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-72 shrink-0 border-r border-border bg-surface select-none h-screen sticky top-0",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg text-text tracking-tight">
              {APP_CONFIG.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
              POS
            </span>
          </div>
          <span className="text-[11px] text-text-muted font-medium truncate max-w-[160px]">
            {APP_CONFIG.tagline}
          </span>
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {NAVIGATION_SECTIONS.map((section) => {
          // Filter items based on user role
          const visibleItems = section.items.filter((item) => {
            if (item.roleRequired && currentRole === "STAFF" && item.roleRequired === "OWNER") {
              return false;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted/80">
                {section.title}
              </h4>
              <div className="space-y-0.5 pt-1">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-subtle font-semibold"
                          : "text-text-muted hover:text-text hover:bg-surface-muted"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-foreground"
                              : item.aiFeature
                              ? "text-primary group-hover:text-primary-hover"
                              : "text-text-muted group-hover:text-text"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                              isActive
                                ? "bg-white/20 text-white"
                                : item.aiFeature
                                ? "bg-primary-subtle text-primary border border-primary/30"
                                : "bg-surface-muted text-text-muted border border-border"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User / Branch Footer */}
      <div className="p-4 border-t border-border bg-surface-muted/40">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-border/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-xs">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-text truncate">
              {userName}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              {currentRole === "OWNER" ? (
                <>
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  <span>Owner (Full Access)</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3 w-3 text-info" />
                  <span>Staff / Cashier</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
