# KhaylimTech Storefront Redesign Plan

## September 23 Revamp Scope, Pending Approval

Preserve the existing uncommitted work and brand identity. Refresh the actual shopping experience across all eight pages, without replacing the static stack or changing bot infrastructure.

- Visual tokens: black #101010, graphite #242424, gold #C9A227, white #FFFFFF, light gray #F3F4F5, and green #23764B for availability. Keep the existing Manrope and DM Sans fonts, fixed text sizes, and zero letter spacing.
- Homepage: compact branded header, visible search, category navigation, a product-photo-led feature area, and an early product grid. Keep product photography clear and avoid oversized promotional sections.
- Catalog: shared product cards with the homepage, two mobile columns that fit the viewport, a mobile filter drawer, and a desktop sidebar with contained price inputs.
- Product details: responsive image/video gallery, clear price and availability, quantity controls, and a prominent cart action. Preserve asynchronous Firebase rendering.
- Cart and information pages: consistent spacing, readable forms and order summaries, and clear WhatsApp ordering.
- Keep light/dark modes, active category navigation, cart persistence, wishlist, search, sorting, filtering, clean URLs, and Firebase data integration.

### Exact File Scope

- [MODIFY] `css/professional.css`: primary visual redesign using the existing final styling layer.
- [MODIFY] `css/responsive.css`, `css/style.css`, `css/animations.css`: resolve conflicting sizing and layout rules as needed, without global clipping workarounds.
- [MODIFY] `index.html`, `products.html`, `product-detail.html`, `cart.html`: shopping layout and semantic controls.
- [MODIFY] `about.html`, `contact.html`, `faq.html`, `how-to-order.html`: shared navigation and supporting-page consistency.
- [MODIFY] `js/app.js`, `js/products.js`, `js/detail.js`, `js/cart.js`: only UI behavior and generated markup required by the redesign.
- [MODIFY] `qa/visual-check.js`, `qa/verify.js`: relevant responsive and interaction checks.
- [MODIFY] `task.md`, `system_architecture.md`: record progress and final structure.
- Preserve catalog records, Firebase configuration, credentials, bot code, and deployment configuration. No publishing or pushing in this scope.

### Verification and Handoff

Run the local development server on an available port. Check screenshots at 360, 390, 768, and 1440 pixels in both themes. Verify page and input overflow, mobile navigation and filters, search, category selection, product details, image/video controls, cart persistence, and WhatsApp link generation without sending an order. Report external-service failures separately from local test results. Provide the local preview URL for review.

## Direction

Build a polished local electronics store around the existing black and warm-gold identity. The visual character will come from precise product photography, confident editorial typography, disciplined spacing, and clear purchasing cues. The design will avoid decorative emoji, generic gradient cards, repeated pills, and motion that competes with shopping.

## Existing work to preserve

- Keep the current product data, Firebase loading, cart, wishlist, search, filtering, theme switch, WhatsApp ordering, routes, and recent uncommitted edits.
- Keep the supplied KhaylimTech logo and brand colors.
- Preserve the current static deployment structure and clean URLs.

## Files

- [MODIFY] css/style.css
  - Replace the soft, rounded visual system with tighter retail tokens, stronger typography, quieter surfaces, and consistent controls.
  - Rework navigation, hero, trust strip, category tiles, product cards, promotion panel, inner-page headers, forms, cart, detail views, and footer.
  - Add visible focus states, consistent minimum tap sizes, clearer disabled states, and restrained hover feedback.
- [MODIFY] css/responsive.css
  - Repair mobile hierarchy, catalog filters, grid breakpoints, navigation, touch targets, and product-detail layout.
- [MODIFY] css/animations.css
  - Reduce decorative movement, keep short purposeful transitions, and preserve reduced-motion support.
- [MODIFY] index.html
  - Replace emoji category and section decoration with the existing icon system.
  - Refine the hero structure and copy hierarchy while keeping its product carousel and commerce links.
- [MODIFY] products.html
  - Improve the catalog header, filtering hierarchy, results controls, and empty states without changing filter behavior.
- [MODIFY] product-detail.html
  - Improve product information hierarchy, purchase actions, trust cues, and media treatment.
- [MODIFY] cart.html
  - Improve cart readability, order summary, checkout hierarchy, and empty state.
- [MODIFY] about.html, contact.html, faq.html, how-to-order.html
  - Apply the shared visual system and improve page-specific content hierarchy.
- [MODIFY] js/app.js
  - Remove emoji-based UI generated in product cards and strengthen accessible labels where needed.
- [MODIFY] js/products.js, js/detail.js
  - Adjust generated markup only where needed for the new design and accessibility.

## Verification

- Run the local server and inspect the home, catalog, product detail, cart, and content pages.
- Check responsive layouts at 375, 768, 1024, and 1440 pixels.
- Test navigation, search, filters, theme switching, product links, wishlist, cart actions, and WhatsApp ordering.
- Check browser console errors and run a final source diff to confirm existing behavior was preserved.

## Stacked Homepage Scroll, Pending Approval

### Concept

Replace the long, flat homepage sequence with a stacked-panel scroll. The hero becomes an immersive first viewport using the existing KhaylimTech flagship image as a full-bleed background. Each major section rises from below and pins beneath the fixed navigation, covering the previous panel like a deck of cards. The top edge and shadow of the previous panel remain briefly visible to make the layering clear.

Product grids remain normal vertical content inside their panel. This avoids scroll hijacking and keeps products easy to scan and tap.

### Files

- [MODIFY] `index.html`: create the full-bleed hero and group the homepage into flagship, catalog, arrivals, trust, and customer-story panels.
- [MODIFY] `css/professional.css`: add sticky panel positioning, layer order, leading-edge radius, restrained shadows, responsive fallback, and reduced-motion fallback.
- [MODIFY] `js/app.js`: track the active panel only for subtle depth state. Do not take control of native scrolling.
- [MODIFY] `qa/visual-check.js`: check sticky offsets, panel ordering, mobile fallback, overflow, and existing shopping interactions.
- [MODIFY] `task.md`, `system_architecture.md`: track and document the scroll model.

### Verification

Check the homepage at 360, 390, 768, 1024, and 1440 pixels. Verify that panels overlap beneath the navigation, all content remains reachable, product actions still work, the footer follows the final panel normally, reduced-motion users get a standard flow, and no horizontal overflow or scroll trapping is introduced.

## Three.js Product Atmosphere, Approved

Add a full-bleed, transparent Three.js canvas to the hero. It will use restrained metallic rings and circuit-like geometry around the product photography, with subtle pointer parallax and continuous motion. The product image remains the main visual and the scene remains decorative and non-interactive.

- [ADD] `js/hero-scene.js` and a local Three.js module so the deployed site does not depend on a runtime CDN.
- [MODIFY] `index.html` and `css/professional.css` to layer the canvas across the hero without framing it or blocking controls.
- [MODIFY] `qa/visual-check.js` to assert that the canvas is present, painted, changing between frames, and responsive without page overflow.
- Reduced-motion users receive a single rendered frame, and unsupported WebGL falls back to the existing product photograph.
