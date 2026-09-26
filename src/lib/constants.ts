import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Boxes,
  Truck,
  PackagePlus,
  Receipt,
  RotateCcw,
  FileText,
  BarChart3,
  Sparkles,
  Bot,
  Cpu,
  Settings,
} from "lucide-react";

export const APP_CONFIG = {
  name: "SehatStock",
  tagline: "Smart Pharmacy Management & POS System",
  motto: "Sehat = Health • Stock = Inventory",
  version: "1.0.0",
  branchName: "Central Health Pharmacy (Branch #1)",
};

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  aiFeature?: boolean;
  roleRequired?: "OWNER" | "STAFF";
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Pharmacy Operations",
    items: [
      {
        title: "Point of Sale (POS)",
        href: "/pos",
        icon: ShoppingCart,
        badge: "F2",
      },
      {
        title: "Returns & Refunds",
        href: "/returns",
        icon: RotateCcw,
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: FileText,
      },
      {
        title: "Sales History",
        href: "/sales",
        icon: Receipt,
      },
    ],
  },
  {
    title: "Inventory & Supply",
    items: [
      {
        title: "Medicines Catalog",
        href: "/medicines",
        icon: Pill,
      },
      {
        title: "Stock & Batches",
        href: "/inventory",
        icon: Boxes,
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        roleRequired: "OWNER",
      },
      {
        title: "Purchases",
        href: "/purchases",
        icon: PackagePlus,
        roleRequired: "OWNER",
      },
    ],
  },
  {
    title: "AI Intelligence Suite",
    items: [
      {
        title: "AI Semantic Search",
        href: "/ai-search",
        icon: Sparkles,
        badge: "AI #1",
        aiFeature: true,
      },
      {
        title: "AI Chat Assistant",
        href: "/ai-assistant",
        icon: Bot,
        badge: "AI #2",
        aiFeature: true,
      },
      {
        title: "AI Restock Automation",
        href: "/automation",
        icon: Cpu,
        badge: "AI #3",
        aiFeature: true,
        roleRequired: "OWNER",
      },
    ],
  },
  {
    title: "Analytics & Settings",
    items: [
      {
        title: "Reports & Analytics",
        href: "/reports",
        icon: BarChart3,
        roleRequired: "OWNER",
      },
      {
        title: "System Settings",
        href: "/settings",
        icon: Settings,
        roleRequired: "OWNER",
      },
    ],
  },
];

export const DEMO_USERS = [
  {
    role: "OWNER",
    name: "Dr. Hamza Malik",
    email: "owner@sehatstock.pk",
    label: "Pharmacy Owner (Full Access)",
  },
  {
    role: "STAFF",
    name: "Ayesha Tariq",
    email: "staff@sehatstock.pk",
    label: "Staff / Cashier (POS & Sales)",
  },
];
