"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import {
  Menu,
  ShoppingCart,
  Bell,
  Sparkles,
  Building2,
} from "lucide-react";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/95 px-4 md:px-6 backdrop-blur transition-all">
      {/* Left side: Mobile menu toggle + Branch indicator */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-text">
            {APP_CONFIG.branchName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success/20">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            FEFO Active
          </span>
        </div>
      </div>

      {/* Right side: Quick AI Search, POS button, Notifications, Role badge */}
      <div className="flex items-center gap-2.5">
        {/* Quick AI Search Shortcut */}
        <Link href="/ai-search">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-text-muted hover:text-text bg-surface-muted/50 border-border"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">AI Semantic Search</span>
            <kbd className="ml-1 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-text-subtle">
              Ctrl+K
            </kbd>
          </Button>
        </Link>

        {/* Quick POS Action Button */}
        <Link href="/pos">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Open POS</span>
            <kbd className="hidden sm:inline-block ml-1 rounded bg-white/20 px-1 py-0.2 text-[10px] font-mono">
              F2
            </kbd>
          </Button>
        </Link>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-text-muted hover:text-text"
          aria-label="View alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </Button>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
          <Badge variant="primary" className="text-[11px] font-semibold">
            OWNER
          </Badge>
        </div>
      </div>
    </header>
  );
}
