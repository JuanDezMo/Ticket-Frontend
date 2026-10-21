---
target: eventos y seats
total_score: 21
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 3
target_identity: 'file:/home/juandezmo/Documents/ticket_frontend/src/features/events'
timestamp: 2026-10-21T21-41-47Z
slug: src-features-events
---

# Crítica: eventos y seats (src/features/events, src/features/seats)

Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 21/40 (Acceptable)

| #   | Heuristic                       | Score | Key issue                                                                             |
| --- | ------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| 1   | Visibility of System Status     | 2     | Seat map only updates via Refresh; summary below the grid; no hint of the 10-min hold |
| 2   | Match System / Real World       | 2     | No stage orientation; "Capacity" reads as availability; "Blocked" is jargon           |
| 3   | User Control and Freedom        | 3     | Deselect, filter-preserving back link, Clear filters                                  |
| 4   | Consistency and Standards       | 3     | Consistent components; mobile row columns misalign (26px vs 36px tiles)               |
| 5   | Error Prevention                | 3     | Non-selectable seats not buttons; date range validated                                |
| 6   | Recognition Rather Than Recall  | 2     | Reserved vs Sold by hue only; price far from selection                                |
| 7   | Flexibility and Efficiency      | 1     | No arrow-key grid nav (up to 260 tab stops); no date presets                          |
| 8   | Aesthetic and Minimalist Design | 2     | Flat; filters dominate mobile fold; equal-weight card lines                           |
| 9   | Error Recovery                  | 2     | Lost-seat message has no next step                                                    |
| 10  | Help and Documentation          | 1     | Nothing explains hold, sign-in need, statuses                                         |

## Design specificity

Stock shadcn radix-nova starter (neutral greys, Geist, near-black primary, no accent). Seat grid is the only product-specific element and reads as a checkbox list. Detector: CLI 0 findings; browser 11 nested-cards + 1 layout-transition, both false positives.

## Priority issues

- [P0] Dark mode not wired; forced .dark breaks seat palette (pastels on black, selected ~1.1:1); sonner theme="light". Fix: no-flash theme script + Light/Dark/System selector + semantic seat tokens + non-color selected cue. Cmd: colorize, harden.
- [P1] Mobile seat tiles 26x36px and misaligned columns; header targets 20-28px. Fix: fixed 10-col grid, ~44px targets with horizontal scroll + sticky row label. Cmd: adapt.
- [P1] Selection is a dead end (no price, CTA, hold mention; lost-seat no recovery). Fix: sticky bottom bar "A4 · $49.99 · Reserve (held 10 min)", better lost-seat copy. Cmd: shape, clarify.
- [P1] Seat status relies on color; tile non-text contrast <3:1 (max 2.63); focus ring ~2.5:1. Fix: per-status shape/glyph, ≥3:1 borders and focus. Cmd: harden.
- [P2] Mobile list filter-first (first card at y=509/844); cards lack hierarchy and availability. Fix: collapse filters into sheet, date-led card with availability. Cmd: layout, typeset.

## Persona red flags

Casey: tiny tiles, selection out of thumb zone, Refresh top-right, filters push events below fold.
Jordan: only "Sign in" offered at the seat wall; no explanation of hold/statuses; "Capacity" misleads.
Sam: 260 tab stops; focus <3:1; dark selected seat ~1.1:1.
Valeria (on-sale fan): stale snapshot map; no "N left"; account wall at peak intent; unclear if register returns to event.

## Minor observations

Detail type subtitle / unlabeled description; mobile dl pairs don't read as pairs; desktop map left-aligned; "Page 1 of 1" shown; full email in header; cancelled cards keep full hover/contrast; unused chart/sidebar tokens.

## Questions

1. Why is time invisible until after commitment?
2. Should guests see the map read-only and hit the account wall only at Reserve?
3. Grid-first vs best-available/row-first on mobile?
