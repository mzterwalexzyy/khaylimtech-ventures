# KhaylimTech storefront architecture

## Page structure

KhaylimTech is a static multi-page storefront served by `dev-server.js`. Clean routes such as `/products`, `/phones`, and `/product/ph001` resolve to the existing HTML pages. Each page shares the same navigation, theme controls, cart access, and footer.

## Styling layers

Styles load in this order:

1. `css/style.css` provides the original component and page rules.
2. `css/responsive.css` provides the original breakpoint behavior.
3. `css/animations.css` provides motion utilities.
4. `css/professional.css` is the final storefront design layer.

The last layer owns the current visual system. It defines the black, graphite, warm gold, and neutral palette, Manrope and DM Sans typography, layout proportions, shared interaction states, accessible focus rings, page-specific refinements, and responsive behavior.

## Storefront behavior

- `js/data.js` contains the product catalog and category metadata.
- `js/app.js` manages shared navigation, theme, search, product cards, wishlist state, cart state, and WhatsApp support.
- `js/products.js` manages catalog search, sorting, category filters, price filters, stock filters, and the mobile filter drawer.
- `js/detail.js` manages product detail rendering and add-to-cart actions.
- `js/cart.js` manages cart rendering and quantity changes.
- Firebase scripts merge remote product data into the local catalog when the service is available.

## Design principles

- Product images and prices carry the visual hierarchy.
- Warm gold is reserved for actions, active states, and commercial highlights.
- Surfaces use restrained corners, thin borders, and quiet shadows.
- Decorative emoji have been replaced with one icon system.
- Core content stays visible if animation observers or remote assets load slowly.
- The catalog keeps filters pinned on larger screens and collapses them behind one control on mobile.

## Verification

`qa/visual-check.js` opens all public pages at desktop and mobile widths, records screenshots, checks HTTP status and horizontal overflow, and verifies the mobile menu, theme toggle, cart flow, mobile filter panel, and stock filtering. Its latest report is stored in `qa/report.json`.

## Interaction layer

- Motion tokens live in the final section of `css/professional.css`, which loads after the legacy style layers and owns the effective interaction behavior.
- Product cards receive a short stagger when local or Firebase products render. `initInteractiveSurfaces()` observes each product grid so asynchronous catalog updates receive the same treatment.
- Cart badges, wishlist controls, add-to-cart buttons, navigation, toasts, and the mobile filter sheet provide direct state feedback. All interaction motion has a reduced-motion fallback.
- At 768 pixels and below, the catalog remains a two-column grid and filters open as a bottom sheet. The final style layer also owns the mobile cart column rule to prevent legacy desktop rules from causing overflow.
- `qa/visual-check.js` checks every public route at 360, 390, 768, and 1440 pixels. The Google Maps embed bootstrap error is excluded because it is external to the storefront runtime.
