"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";
import { loginAction, quickDemoLoginAction } from "@/lib/actions/auth";
import {
  Stethoscope,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Cpu,
  Bot,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("owner@sehatstock.pk");
  const [password, setPassword] = React.useState("demo1234");
  const [selectedRole, setSelectedRole] = React.useState<"OWNER" | "STAFF">("OWNER");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSelectDemoUser = async (role: "OWNER" | "STAFF") => {
    setSelectedRole(role);
    setErrorMessage(null);
    setIsLoading(true);

    const res = await quickDemoLoginAction(role);
    if (res.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || "Failed to switch demo role.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginAction(formData);
    if (res.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left/Main Form Container */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-text">
                  {APP_CONFIG.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-subtle text-primary border border-primary/20">
                  POS
                </span>
              </div>
              <p className="text-xs text-text-muted">{APP_CONFIG.tagline}</p>
            </div>
          </div>

          {/* Teacher / Demo Presets Banner */}
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary-subtle/50 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Demo Quick-Login (Evaluation Presets)</span>
            </div>
            <p className="text-text-muted text-[11px] mb-2.5">
              Click either role to immediately log in with verified database credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSelectDemoUser("OWNER")}
                className={`flex flex-col items-start p-2 rounded border text-left transition-all ${
                  selectedRole === "OWNER"
                    ? "border-primary bg-surface shadow-subtle text-text"
                    : "border-border bg-surface/50 text-text-muted hover:bg-surface"
                }`}
              >
                <span className="font-semibold text-xs text-primary">Owner / Admin</span>
                <span className="text-[10px] text-text-muted">Full Access & AI PO</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSelectDemoUser("STAFF")}
                className={`flex flex-col items-start p-2 rounded border text-left transition-all ${
                  selectedRole === "STAFF"
                    ? "border-primary bg-surface shadow-subtle text-text"
                    : "border-border bg-surface/50 text-text-muted hover:bg-surface"
                }`}
              >
                <span className="font-semibold text-xs text-primary">Staff / Cashier</span>
                <span className="text-[10px] text-text-muted">POS & Lookup Only</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-danger-subtle border border-danger/20 p-2.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="name@pharmacy.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text">
                  Password
                </label>
                <span className="text-xs text-primary cursor-pointer hover:underline">
                  Forgot?
                </span>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="••••••••••••"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Remember this terminal
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to Pharmacy Portal
            </Button>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-text-muted">
            {APP_CONFIG.motto}
          </p>
        </div>
      </div>

      {/* Right Feature Showcase Hero */}
      <div className="relative hidden w-0 flex-1 lg:flex flex-col justify-between bg-secondary p-12 text-secondary-foreground border-l border-border/40 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">
              Internal Pharmacy Management System
            </span>
          </div>
          <Badge variant="outline" className="border-secondary-subtle/30 text-white/80">
            v1.0 Production Ready
          </Badge>
        </div>

        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Precision Pharmacy Operations with Integrated AI
            </h2>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed">
              Designed for physical pharmacy counters: lightning-fast Point of Sale,
              FEFO batch tracking, owner discount authorization, traceable returns,
              and three fully functional AI capabilities.
            </p>
          </div>

          {/* Mandatory AI Features Checklist */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Academic Requirement — 3 Mandatory AI Subsystems
            </span>

            <div className="grid gap-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    1. AI Semantic Search
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Natural language medicine retrieval using Gemini embeddings and vector similarity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    2. AI Operational Chatbot
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Live operational assistant querying real PostgreSQL tables via controlled tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    3. AI Restock Workflow Automation
                  </h4>
                  <p className="text-[11px] text-white/70">
                    Low-stock demand analysis, purchase order draft generation, and human-in-the-loop owner approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-secondary-foreground/60 border-t border-white/10 pt-4">
          <span>Physical Counter POS • FEFO Stock Rotation • Audit Trail</span>
          <span>Academic Project Demonstration</span>
        </div>
      </div>
    </div>
  );
}
