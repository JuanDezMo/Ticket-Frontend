---
version: 1
slug: 'src-features-events'
primary_target: 'src/features/events'
related_targets: ['src/features/seats', 'src/app/AppLayout.tsx']
---

# Surface brief: events, event detail and seat map

## Scope and mode

Operate. Public events list (`/`), event detail (`/events/:id`) and the seat map, plus the app shell (header, theme selector). The primary visitor is the general public on a phone, often arriving from a shared link, picking one seat before it is gone. Secondary: ADMIN viewing the same pages without seat selection.

## Constraints

- Light and dark themes, both first-class, WCAG 2.2 AA in each. Default follows the OS; Light / Dark / System selector in the header, remembered.
- Visual-only round: the guest still needs a session to see seats; the Reserve action renders but stays disabled until `web-purchase`.
- Copy and accessible names that tests assert stay unchanged unless the user approves.
- No event imagery exists; no invented organizers, claims or counts.
- Standard web navigation and controls; the world lends type, palette, material and one signature move.

## Direction contract

THESIS: Your seat becomes your pass. The event, the row and the hold are printed on a laminate you carry through the flow. It refuses the category default of photo cards plus a generic seat legend.

OWN-WORLD: Gloss tour laminate. Laminate black in dark, white card in light, with a fluoro-orange tier band and signal yellow. Heavy expanded block caps carry codes, dates and prices at three fixed steps, and a workhorse sans sets the text. Panels carry a punched lanyard slot and a hairline gloss edge. State changes land as hard two-frame steps.

STORY: The visitor sees tonight's passes and reads the date at a glance (the list API carries capacity only, per PRODUCT.md, so seats left read on the detail page, never on the cards). Opening one, they see the house as a block-code grid. Picking a seat prints C7 and the price on their pass, and they trust the hold will be shown honestly.

FIRST VIEWPORT: Mobile detail. At the top is the laminate head: tier band, date in block caps, then name and venue. Below it, the seat grid runs in fixed columns with a stage edge marker. At the thumb edge sits the docked pass, showing the seat code, the price and a disabled "Reserve (held 10 min)". The rose and orange accents appear only on pressable things.

FORM: All-Access Laminate, position 5 of 7 on the grounded list. Seed key 459174ee, re-roll 1. Raises: hold duration drawn as exact length (from Dance Score); one display face at three fixed steps (from Bitmap Specimen).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

Tapping a seat prints its block code onto the docked pass with a two-frame stamp.

## Unresolved

- The final platform name ("Tickets" is a working name).
- The hold band and timer are only drawn in this round; they become live in `web-purchase`.
