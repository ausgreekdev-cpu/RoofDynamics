# RoofDynamics — Style Guide

## Color palette (industrial dark/slate theme)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0F172A` | Page background |
| Card | `#1E293B` | Card/panel backgrounds |
| Navy header | `#0A192F` | Top bar, header |
| Electric blue | `#0EA5E9` | Primary actions, links, accents |
| Electric green | `#10B981` | Success, compliant, online |
| High-vis amber | `#F59E0B` | Warnings, pending, developer |
| Danger red | `#EF4444` | Errors, destructive, overdue |
| Text primary | `#F8FAFC` | Headings, body text |
| Text muted | `#94A3B8` | Secondary text, labels |
| Text subtle | `#64748B` | Hints, placeholders |
| Border | `#334155` | Card borders, dividers |

## CSS variables (shadcn/ui tokens)
Use CSS variables where available: `var(--background)`, `var(--card)`, `var(--border)`, `var(--muted-foreground)`, `var(--foreground)`, `var(--primary)`, `var(--destructive)`, `var(--success)`.

## Typography
- Headings: `font-bold`, sizes `text-2xl` (page), `text-lg` (section), `text-sm` (card)
- Body: `text-sm` default, `text-xs` for secondary
- Monospace: `font-mono` for IDs, codes, SKUs

## Spacing
- Page padding: `p-4` or `p-6`
- Card padding: `p-4` or `p-5`
- Section gaps: `space-y-4` or `space-y-6`
- Grid gaps: `gap-3` or `gap-4`

## Components
- Use shadcn/ui primitives from `src/components/ui/` (Button, Card, Input, Dialog, etc.)
- Prefer `Button` over raw `<button>` for actions
- Use `Toast` (via `useToast`) for feedback, not `alert()`
- Use `ConfirmDialog` (via `useConfirm`) for destructive actions, not `confirm()`

## Icons
- Use Lucide icons (`lucide-react`)
- Standard sizes: `w-4 h-4` (inline), `w-5 h-5` (buttons), `w-6 h-6` (headers)

## Responsive breakpoints
- Mobile: default (< 768px)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Sidebar collapses on mobile (`lg:hidden`)

## Accessibility
- All interactive elements need `aria-label` if icon-only
- Use semantic HTML (`<main>`, `<nav>`, `<header>`)
- Minimum touch target: 44px
- Color contrast: WCAG AA (4.5:1 for text)