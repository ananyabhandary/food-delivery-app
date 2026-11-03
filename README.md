# Bitezy – Food Delivery & Restaurant Discovery App

A fully working front-end food ordering app built with plain HTML, CSS and JavaScript. No installs, no build step.

## Run in VS Code

**Option 1 (easiest):**
1. Open the `food-delivery-app` folder in VS Code (File → Open Folder).
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.

**Option 2 (no extension):** open `index.html` directly in Chrome/Edge. It works from `file://`.

**Option 3 (terminal):** `python -m http.server 5500` then visit http://localhost:5500

## Features

- **Discovery:** live search (restaurant, cuisine or dish), cuisine chips, pure-veg filter, sort by rating / time / fee / price
- **Menu browsing:** category tabs, veg / non-veg markers, add / quantity stepper
- **Cart:** quantity editing, free-delivery progress hint, promo code (`WELCOME50`: 50% off up to ₹100), tax and bill summary
- **Checkout:** validated form (name, 10-digit mobile, address), payment method choice, details remembered for next time
- **Order tracking:** live step tracker (Placed → Preparing → Out for delivery → Delivered) running at demo speed (~40 s), plus order history
- Cart and orders persist in `localStorage`

## UI/UX notes (matches the resume bullets)

- Design tokens (colour, radius, shadow, type) defined once as CSS variables in `styles.css`
- Reusable components in `app.js`: `RestaurantCard`, `MenuItem`, `Stepper`, `VegDot`, `BillSummary`, `EmptyState`
- Accessibility: skip link, visible focus rings, labelled controls, `aria-live` updates, inline form errors, reduced-motion support, 44px tap targets
- Responsive, mobile-first layout

## Project structure

```
food-delivery-app/
├── index.html   # page shell
├── styles.css   # design tokens + components + layout
├── data.js      # restaurants, menus, promo codes (edit this to add your own)
├── app.js       # router, state, views, components, validation
└── README.md
```

## Pairing with Figma

For the UI/UX side of the project, recreate these screens in Figma (Home, Menu, Cart, Checkout, Tracking), build the components above as Figma components/variants, and link the Figma prototype in your resume or portfolio next to this running app.
