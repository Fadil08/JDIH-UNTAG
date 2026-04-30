# Design Brief: JDIH Kampus UNTAG Banyuwangi

## Purpose
Institutional legal documentation portal (JDIH) for UNTAG Banyuwangi. Public-facing portal + modernized admin dashboard with sidebar navigation, user management, and activity audit trails.

## Tone & Aesthetic
Minimalist institutional dashboard. Three-color palette: white, red, black. High contrast, formal, trustworthy. Admin sidebar: black structure, red accents. No decoration, high information density for productivity.

## Color Palette

| Name | OKLCH | Hex | Use |
|---|---|---|---|
| Brand Black | 0.13 0 0 | #111111 | Sidebar, text, borders, structure |
| Brand Red | 0.5 0.22 25 | #dc2626 | Buttons, active states, highlights |
| Brand White | 1.0 0 0 | #ffffff | Background, cards, text contrast |
| Muted Gray | 0.95 0 0 | #f2f2f2 | Card backgrounds, alternating rows |
| Border Gray | 0.88 0 0 | #e0e0e0 | Dividers, input borders |

## Typography

| Tier | Font | Weight | Size | Use |
|---|---|---|---|---|
| Display | DM Sans | 700 | 2rem–3rem | Page titles, dashboard headers |
| Heading | DM Sans | 600 | 1.25–1.5rem | Card titles, section headers |
| Body | DM Sans | 400–500 | 0.875–1rem | Paragraphs, labels, table text |
| Mono | JetBrains Mono | 400 | 0.75rem | Document numbers, user principals, timestamps |

## Structural Zones

| Zone | Background | Border | Purpose |
|---|---|---|---|
| Sidebar (Admin) | Brand Black (0.13 0 0) | Sidebar Border (0.25 0 0) | Navigation menu, logo area |
| Top Header | Brand White (1.0 0 0) | Border Gray (0.88 0 0) | User identifier, logout |
| Dashboard Cards | Brand White (1.0 0 0) | Border Gray (0.88 0 0) | Stats, quick actions, info |
| Activity Log | Brand White (1.0 0 0) + alternating Muted | Border Gray | Timestamps, actions, audit trails |
| Main Content | Brand White (1.0 0 0) | None | Document lists, forms, user table |

## Component Patterns
- Buttons: Red background, white text, 4px radius, hover opacity 90%
- Sidebar items: Black background, white text, red highlight for active state
- Stat cards: White background, light border, red accent icon/number
- Activity table: White rows + gray alternating, minimal dividers
- Audit badges: Red text on white, monospace font for user principal
- Form inputs: White background, gray border, focus ring red

## Spacing & Rhythm
- Sidebar width: 260px (desktop), hamburger drawer (mobile)
- Padding: 16px (lg), 12px (md), 8px (sm), 4px (xs)
- Dashboard cards: 6-column grid (responsive 2–3 cols mobile)
- Activity log: full-width table, condensed row height

## Motion
- Sidebar transitions: smooth (0.25s), no bounce
- Hover states: opacity 90% on interactive elements
- Mobile drawer: slide from left, 250ms timing

## Constraints & Rules
- Three-color strict adherence: white, red, black only
- All UI in Bahasa Indonesia
- Light mode only
- High contrast AA+ throughout
- Mobile-first responsive, hamburger/drawer for sidebar
- Sidebar visible only with granted access per menu item
- Audit trail: timestamp + action + username on all document/article changes
- Admin form inputs use monospace for principal/ID fields

## Signature Detail
Minimalist sidebar dashboard: fixed black sidebar (white text, red highlights) signals admin context. Top header bar separates navigation. Dashboard stat cards with red accent numbers convey authority and clarity. Activity log with audit user column demonstrates accountability. Three-color palette reinforces institutional formality.
