---
target: eventos y seats (re-run)
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: 'file:/home/juandezmo/Documents/ticket_frontend/src/features/events'
timestamp: 2026-10-22T02-56-03Z
slug: src-features-events
---

# Critique (re-run): events and seats

Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 28/40 (Good; previous run 21/40)

1 Visibility 3 · 2 Real world 3 · 3 Control 3 · 4 Consistency 3 · 5 Error prevention 3 · 6 Recognition 3 · 7 Flexibility 2 · 8 Aesthetic 3 · 9 Error recovery 3 · 10 Help 2

## Specificity

Authored for the product (pass metaphor, 10-segment hold ruler, seat-state grammar). Template remnants: filter bar/native date inputs, Stage bar, detail header as a spec table. Detector CLI clean; browser overlay flagged "hairline border with wide shadow" (not confirmed false positive) and "layout transition: height" (known false positive on body).

## Priority issues

- [P1] Docked pass covers ~27% of the mobile viewport (225/844) with a seat selected. Fix: one-row pass 96-120px, collapse event line + hold note, drop punch on mobile. layout
- [P1] Guest wall hides availability with no reason, no count, no Sign up link. Fix: explain, add Sign up. clarify
- [P2] Mobile seat grid clipped (10 cols x 44px = 440 > 358); no overview. Fix: ~32-34px tiles that fit, sticky legend, jump to row. adapt
- [P2] Detail header is a spec sheet (~530px of 844); Capacity irrelevant to buyers. Fix: "N left", price in display, tighter. distill
- [P3] Hold rule explained late; disabled Reserve reads as broken. onboard

## Measured (B)

Contrast 44/44 pass. Mobile 390: seats 44x44, header 44px, only Refresh under 44 (36px). Keyboard: one tab stop in map, arrows move focus. Focus outline 2px (dark ink in light, yellow in dark). No page overflow at 390. B's "5x5 grid fits" claim is wrong (rows are 10 wide); not relied on.

## Personas

Casey: selected seat behind the pass, two-axis scroll, Refresh out of thumb reach. Jordan: "printed on your pass" unclear, unexplained disabled Reserve. Sam: fixed pass can cover focus at 200% zoom, 12px key lines. Valeria: no "N left", manual Refresh, no best-available.

## Minor

Desktop map is a small island; email truncates; Events loses underline on detail; two stacked laminates; long prices may overflow at 360px.
