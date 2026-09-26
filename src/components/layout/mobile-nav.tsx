"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_CONFIG, NAVIGATION_SECTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { X, Stethoscope } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-secondary/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-surface border-r border-border p-4 shadow-modal flex flex-col animate-slide-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-text">
                {APP_CONFIG.name}
              </span>
              <p className="text-[10px] text-text-muted">POS & Pharmacy SaaS</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <h5 className="px-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                {section.title}
              </h5>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-text-muted hover:text-text hover:bg-surface-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-surface-muted text-text-muted"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-muted">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs">
              HM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text">Dr. Hamza Malik</span>
              <span className="text-[10px] text-text-muted">Owner (Full Access)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
