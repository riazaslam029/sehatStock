# SehatStock Design System Specification

## 1. Vision & Brand Identity

**SehatStock** is a professional, high-performance internal Pharmacy Management & Point-of-Sale (POS) System built for physical pharmacy counters.
- **"Sehat"** = Health
- **"Stock"** = Pharmacy Inventory

The visual design communicates **Clinical Precision, High Operational Speed, Trustworthiness, and Modern SaaS Elegance**. It avoids excessive gradients, distracting glowing graphics, and unnecessary glassmorphism in favor of crisp visual hierarchy, high contrast, and accessible typography.

---

## 2. Centralized Single Source of Truth

All design tokens are defined in **`/src/styles/tokens.css`** and bound directly to Tailwind CSS in **`tailwind.config.ts`**.
> **Theme Customization Rule**: Modifying `--primary` in `src/styles/tokens.css` immediately changes the primary brand color globally across buttons, active navigation links, tabs, badges, and focus rings.

---

## 3. Color Tokens

| Token Name | CSS Variable | HSL Value | Hex Approx | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **primary** | `--primary` | `173 80% 32%` | `#0d9488` | Core brand color (clinical teal-emerald), main CTAs |
| **primary-hover** | `--primary-hover` | `174 84% 26%` | `#0f766e` | Interactive hover state for primary elements |
| **primary-active** | `--primary-active` | `174 86% 22%` | `#115e59` | Active pressed state for primary elements |
| **primary-subtle** | `--primary-subtle` | `168 76% 96%` | `#f0fdfa` | Tinted background for active items, chips & banners |
| **primary-foreground** | `--primary-foreground`| `0 0% 100%` | `#ffffff` | High contrast text on primary backgrounds |
| **secondary** | `--secondary` | `222 47% 11%` | `#0f172a` | Deep slate/navy for navigation, dark accents |
| **secondary-hover** | `--secondary-hover` | `217 33% 17%` | `#1e293b` | Interactive hover state for secondary actions |
| **background** | `--background` | `210 40% 98%` | `#f8fafc` | Ultra-clean neutral canvas background |
| **surface** | `--surface` | `0 0% 100%` | `#ffffff` | Clean container, card, modal, and panel background |
| **surface-muted** | `--surface-muted` | `210 40% 96.5%`| `#f1f5f9` | Table header rows, disabled backgrounds, subtle wells |
| **surface-hover** | `--surface-hover` | `214 32% 93%` | `#e2e8f0` | Table row hover highlight |
| **text** | `--text` | `222 47% 11%` | `#0f172a` | High-contrast body, heading, and table text |
| **text-muted** | `--text-muted` | `215 16% 47%` | `#64748b` | Secondary descriptions, captions, column headers |
| **text-subtle** | `--text-subtle` | `215 20% 65%` | `#94a3b8` | Placeholders, inactive icons, helper text |
| **border** | `--border` | `214 32% 91%` | `#e2e8f0` | Structural borders on cards, inputs, and dividers |
| **success** | `--success` | `142 71% 40%` | `#16a34a` | Completed sales, FEFO healthy stock, safe margins |
| **warning** | `--warning` | `38 92% 48%` | `#d97706` | Near-expiry batches (≤30 days), discount approval needed |
| **danger** | `--danger` | `0 72% 51%` | `#dc2626` | Critical low stock, expired batches, sale cancellations |
| **info** | `--info` | `217 91% 56%` | `#2563eb` | Informational callouts, AI search telemetry |

---

## 4. Typography Scale

Built with Next.js font optimization using Geist Sans with strict tabular figures for monetary figures:

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `2.25rem (36px)` | 800 (Extrabold) | `1.15` | `-0.025em` | Login hero, major system announcements |
| **H1** | `1.5rem (24px)` | 700 (Bold) | `1.25` | `-0.02em` | Page main titles (Dashboard, POS, Returns) |
| **H2** | `1.25rem (20px)` | 600 (Semibold) | `1.3` | `-0.015em` | Section headers, card group titles |
| **H3** | `1.125rem (18px)` | 600 (Semibold) | `1.35` | `-0.01em` | Modal titles, card headers |
| **H4** | `1.0rem (16px)` | 600 (Semibold) | `1.4` | `0` | Sub-section headers, widget titles |
| **Body** | `0.875rem (14px)` | 400 (Regular) | `1.5` | `0` | Standard body text, form inputs, table data |
| **Body-Small** | `0.75rem (12px)` | 400 / 500 | `1.5` | `0` | Helper text, secondary table notes |
| **Label** | `0.75rem (12px)` | 600 (Semibold) | `1.25` | `0.02em` | Form labels, navigation category headers |
| **Caption** | `0.6875rem (11px)`| 500 (Medium) | `1.2` | `0.04em` | Status badges, keyboard shortcuts (`F2`, `Ctrl+K`) |

---

## 5. Spacing Scale

Based on an 8-point baseline grid with a 4px fine-tuning step:
- **`xs`**: `0.25rem` (4px) — micro gaps between icons and labels
- **`sm`**: `0.5rem` (8px) — button padding, compact list items
- **`md`**: `1.0rem` (16px) — standard card padding, form field spacing
- **`lg`**: `1.5rem` (24px) — section margins, modal padding
- **`xl`**: `2.0rem` (32px) — page section dividers
- **`2xl`**: `3.0rem` (48px) — major layout breaks
- **`3xl`**: `4.0rem` (64px) — hero section vertical whitespace

---

## 6. Border Radius Tokens

- **`sm`** (`0.375rem` / 6px): Status badges, keyboard tags, tooltip containers
- **`md`** (`0.5rem` / 8px): Inputs, buttons, dropdown menu items
- **`lg`** (`0.75rem` / 12px): Standard cards, stat cards, table containers
- **`xl`** (`1.0rem` / 16px): Modals, high-level dialogs
- **`full`** (`9999px`): Avatars, pill badges, toggle switches

---

## 7. Shadows & Elevation

- **Subtle** (`--shadow-subtle`): `0 1px 2px 0 rgb(15 23 42 / 0.05)` — buttons, table rows
- **Card** (`--shadow-card`): `0 1px 3px 0 rgb(15 23 42 / 0.08)` — dashboard panels, cards
- **Elevated** (`--shadow-elevated`): `0 4px 6px -1px rgb(15 23 42 / 0.07)` — card hover, dropdowns
- **Modal** (`--shadow-modal`): `0 20px 25px -5px rgb(15 23 42 / 0.1)` — modal dialogs, drawers

---

## 8. Animation & Micro-Interactions

Strictly functional and subtle; never sluggish:
- **Fast** (`150ms`): Button press, hover transitions, toggle switches
- **Normal** (`250ms`): Modal appearance, dropdown openings, tab switching
- **Slow** (`400ms`): Page route transitions, drawer slide-in
- **Easing**: Standard `cubic-bezier(0.4, 0, 0.2, 1)` for natural deceleration

---

## 9. Component State Matrix

Every interactive component supports standard accessibility and visual states:
1. **Default**: Crisp border, high-contrast readable text.
2. **Hover**: Smooth color change within 150ms, card subtle elevation.
3. **Active**: Scaled by `0.98` for tactile button feedback.
4. **Focus**: Distinct `ring-2 ring-primary ring-offset-2` for full keyboard navigation.
5. **Disabled**: `opacity-50 pointer-events-none` with visual cursor lock.
6. **Loading**: Interactive lock with `Loader2` spinner and persistent layout width.
7. **Error**: High-visibility rose border and descriptive text.
8. **Success**: Calming emerald confirmation with checkmark feedback.
