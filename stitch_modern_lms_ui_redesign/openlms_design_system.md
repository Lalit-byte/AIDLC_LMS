---
name: "OpenLMS — Terracotta Studio"
description: "A warm, editorial, flat-surface design system for OpenLMS built on crisp 4px geometry, hairline dividers, and high-contrast terracotta and forest-teal accents."
---

## Overview

OpenLMS — Terracotta Studio is designed for educators and platform administrators who spend hours reviewing submissions, tracking enrollments, and managing courses. Instead of generic SaaS gradients and heavy card shadows, it uses warm paper-toned surfaces, crisp 1px hairline borders, sharp 4px corners, and high-legibility typography to keep operational data calm, scannable, and unmistakably human-crafted.

## Colors

The palette pairs a warm alabaster canvas (`#FBF9F6`) and pure white primary cards (`#FFFFFF`) with a deep burnt-terracotta primary (`#781F00` / `#9A3412`) and a forest-teal secondary (`#006A63`). Status colors are reserved strictly for operational states (published, paid, pending, failed) and never used decoratively.

```yaml
colors:
  success: "#15803D"
  on-success: "#FFFFFF"
  success-container: "#DCFCE7"
  on-success-container: "#14532D"
  warning: "#B45309"
  on-warning: "#FFFFFF"
  warning-container: "#FEF3C7"
  on-warning-container: "#78350F"
  border-subtle: "#E4E2DF"
  border-strong: "#C8C6C4"
  light:
    primary: "#781F00"
    on-primary: "#FFFFFF"
    primary-container: "#9A3412"
    on-primary-container: "#FFFFFF"
    primary-tint: "#FFEDE8"
    on-primary-tint: "#5F1600"
    secondary: "#006A63"
    on-secondary: "#FFFFFF"
    secondary-container: "#E6F4F2"
    on-secondary-container: "#004D47"
    tertiary: "#004172"
    on-tertiary: "#FFFFFF"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
    error-container: "#FFDAD6"
    on-error-container: "#93000A"
    background: "#FBF9F6"
    on-background: "#1B1C1A"
    surface: "#FBF9F6"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F5F3F0"
    surface-container: "#EFEEEB"
    surface-container-high: "#EAE8E5"
    surface-container-highest: "#E4E2DF"
    on-surface: "#1B1C1A"
    on-surface-variant: "#5E5E5C"
    outline: "#777775"
    outline-variant: "#E4E2DF"
  dark:
    primary: "#FFB59F"
    on-primary: "#5F1600"
    primary-container: "#9A3412"
    on-primary-container: "#FFBDA9"
    primary-tint: "#3A0A00"
    on-primary-tint: "#FFDBD1"
    secondary: "#80D5CB"
    on-secondary: "#003733"
    secondary-container: "#00504A"
    on-secondary-container: "#9CF2E8"
    tertiary: "#A0CAFF"
    on-tertiary: "#003259"
    error: "#FFB4AB"
    on-error: "#690005"
    error-container: "#93000A"
    on-error-container: "#FFDAD6"
    background: "#131412"
    on-background: "#E4E2DF"
    surface: "#131412"
    surface-container-lowest: "#0E0E0D"
    surface-container-low: "#1B1C1A"
    surface-container: "#1F201E"
    surface-container-high: "#2A2A28"
    surface-container-highest: "#343533"
    on-surface: "#E4E2DF"
    on-surface-variant: "#ACABA8"
    outline: "#91918E"
    outline-variant: "#30312F"
```

## Typography

Headings use **Bricolage Grotesque** for editorial character without sacrificing operational clarity. All interface copy, navigation, and table cells use **Plus Jakarta Sans** for crisp legibility at small sizes. Order IDs, payment references, and technical identifiers use **Fira Code**. All numeric metrics, currency (`₹`), and dates use `tabular-nums`.

```yaml
typography:
  display-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: -0.5px
  display-lg-mobile:
    fontFamily: "Bricolage Grotesque"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: -0.35px
  headline-md:
    fontFamily: "Bricolage Grotesque"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.2px
  headline-sm:
    fontFamily: "Bricolage Grotesque"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: -0.1px
  title-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
  title-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  title-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.4px
  mono-sm:
    fontFamily: "Fira Code"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
```

## Layout & Spacing

Desktop screens use a persistent 256px workspace sidebar paired with a fluid main canvas (max-width 1280px inside the content region) and a 60px top navigation bar. A strict 4px/8px spacing grid keeps KPI strips, tables, and course cards aligned.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 40px
  page-margin: 32px
```

## Elevation & Depth

Hierarchy relies on **tonal surface steps and 1px hairline borders** rather than drop shadows. The page canvas sits at `surface` (`#FBF9F6`), primary cards and tables sit on `surface-container-lowest` (`#FFFFFF`) with a `1px solid` `border-subtle` (`#E4E2DF`), and secondary containers or table headers sit on `surface-container-low` (`#F5F3F0`). Zero drop shadows are used.

## Shapes

Sharp, architectural **4px corners** (`DEFAULT: 4px`, `md: 6px`) define cards, buttons, inputs, and badges. Avatars and status indicators use `full` (`9999px`).

```yaml
rounded:
  sm: 2px
  DEFAULT: 4px
  md: 6px
  lg: 8px
  full: 9999px
```

## Motion & Micro-interaction

Transitions are crisp and immediate, limited to background color, border color, and opacity changes. Nothing bounces or loops.

```yaml
motion:
  state-change:
    duration: 120ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 200ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

Copy is direct, operational, and free of marketing fluff.
- **Capitalisation:** Sentence case for subheadings, descriptions, and empty states; concise title case for navigation items and page titles.
- **Action labels:** Verb-first (`Add Course`, `Browse Courses`, `View Students`, `Edit Curriculum`).
- **Formatting:** Currency uses `₹` with Indian comma grouping (`₹21,490`, `₹1,998`) and `tabular-nums`.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html` — `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html` — `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html` — `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Searchbar** → `@components/searchbar.html` — `searchbar-standard`, `searchbar-with-suggestions`
- **Table** → `@components/table.html` — `table-standard`, `table-interactive`, `table-selectable`

## Do's and Don'ts

- **Do** use 1px hairline borders (`border-border-subtle`) and tonal surface shifts (`bg-light-surface` vs `bg-light-surface-container-lowest`) for separation.
- **Do** keep KPI cards clean and editorial — typography-first metrics without decorative colored icon boxes.
- **Don't** use gradients, drop shadows, glassmorphism, or `border-l-4` accent stripes.
- **Don't** use emoji characters anywhere in the UI; use Material Symbols Outlined (`material-symbols-outlined`) consistently.
