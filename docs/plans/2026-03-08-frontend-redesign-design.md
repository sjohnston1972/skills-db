# Frontend Redesign — Design Document

**Date:** 2026-03-08
**Status:** Approved

---

## Goal

Restyle the entire frontend with a dark/light theme system using a "command centre" aesthetic, adding a toggle button in the header. Dark mode uses the provided hex palette; light mode derives a clean counterpart using the same accent colours.

---

## Colour System

### Dark Mode (`[data-theme="dark"]`)

| Token | Value | Use |
|---|---|---|
| `--bg-main` | `#23272a` | Page body |
| `--bg-nav` | `#1a1c1e` | Header + sticky nav |
| `--bg-card` | `#2b2f33` | Cards, panels, modals |
| `--accent` | `#00a3ff` | Primary buttons, active nav, links |
| `--accent-2` | `#00d1ff` | Secondary highlights |
| `--accent-grad` | `#4d4dff` | Gradient accents |
| `--warning` | `#ffb000` | Warning states |
| `--danger` | `#ff4d4d` | Errors, deletes |
| `--success` | `#00e676` | Success states |
| `--text-primary` | `#ffffff` | Headers, key stats |
| `--text-secondary` | `#a0aec0` | Labels, metadata |
| `--border` | `rgba(255,255,255,0.08)` | Subtle dividers |

### Light Mode (`[data-theme="light"]`)

| Token | Value |
|---|---|
| `--bg-main` | `#f0f4f8` |
| `--bg-nav` | `#ffffff` |
| `--bg-card` | `#ffffff` |
| `--accent` | `#00a3ff` (same) |
| `--accent-2` | `#00d1ff` (same) |
| `--accent-grad` | `#4d4dff` (same) |
| `--warning` | `#ffb000` (same) |
| `--danger` | `#ff4d4d` (same) |
| `--success` | `#00e676` (same) |
| `--text-primary` | `#1a1c1e` |
| `--text-secondary` | `#4a5568` |
| `--border` | `#e2e8f0` |

---

## Header + Toggle

- Header restructured to a **flex row**: title/tagline on left, toggle pill on right
- Toggle is a pill-shaped button with inline SVG sun/moon icon
- Clicking toggles `data-theme` on `<html>`, persists to `localStorage`
- Default: dark mode

---

## Component Changes

- **Metric cards**: accent left-border stripe, glow on hover
- **Nav**: `--bg-nav` background, active state with `--accent` underline + subtle glow
- **Buttons**: primary → `--accent`, secondary → ghost (transparent + `--accent` border), danger → `--danger`
- **Heatmap headers**: `--bg-nav` background
- **Modals**: `--bg-card` background, `--border` dividers
- **Weighted gap items**: priority colours map to `--warning`, `--danger`, `--success`
- **Chart.js**: label/legend colours driven by CSS variables read in JS

---

## Files Changed

- `frontend/index.html` — header restructure, toggle button added
- `frontend/styles.css` — full replacement with CSS variable system
- `frontend/script.js` — theme toggle logic + chart colour update on theme change
