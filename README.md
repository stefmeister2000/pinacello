# Pinacello — landing page

High-conversion one-page landing site for Pinacello ambachtelijke likeuren (Dilbeek, België).

Single, self-contained `index.html` (no build step) with a flavor switcher, bundle offers,
market photos, craft story, reviews, FAQ and a 5%-korting e-mailpopup.

## Structure
- `index.html` — the full page (HTML + inline CSS + JS)
- `markets/` — photos of the brothers at markets & events
- `craft/` — photos for the "100% zelfgemaakt" section

## Image delivery

Duo cards use the 400/800/1000 px WebP files in `bundle-assets/` via `srcset`;
keep their full-width card styling in `bundle-assets/bundles.css`. Each variant
is under 65 KB. The original bundle PNGs are retained as editing sources.
The homepage preloads only the selected Pina/Coco hero, while hidden images and
the newsletter popup load lazily. Navigation uses the 480 px WebP logo.
When replacing photos, use a new asset filename to avoid the one-day asset cache.

## Run locally
Open `index.html` directly in a browser, or serve the folder:

```
npx serve .
```

## To do before launch
- Replace placeholder review numbers with real figures
- Connect the e-mailpopup to Wix (search `TODO WIX` in `index.html`)
- Confirm alcohol %, prices and delivery details

## IVOIR landing page

- Page: `ivoir-chocolade-whiskey.html`
- Public path on this landing-page server: `/ivoir-chocolade-whiskey`
- Preview: `npm start`, then `http://localhost:3000/ivoir-chocolade-whiskey`
- Photos: `ivoir-assets/`, from the existing [IVOIR product page](https://www.pinacello.com/product-page/ivoir-chocolade-whiskey).
- This is an independent landing page; product buttons open the existing Wix product page.
- Product copy uses the webshop description and bottle label: Belgian white chocolate, Belgian whisky, 23% alcohol, 500 ml. The page displays the regular €30 price; current promotions and shipping are handled by the webshop.

### IVOIR analytics

Uses the existing GA4 measurement ID `G-T758CLG2LQ`. The config sets
`page_path: /ivoir-chocolade-whiskey` and `content_group: IVOIR`, so the landing page
can be distinguished from the homepage and the Wix `/product-page/...` URL.
The `.html` URL also reports the same page path.

Product links emit the existing `shop_click` event with `landing_page: ivoir`,
`product_id: ivoir`, and `cta_placement: hero | offer | faq | final | sticky`.
Use the page path to filter page reporting. Register the event parameters as
custom dimensions in GA4 if you want them in custom reports. This tracks visits
and outbound shop clicks, not completed Wix purchases.

Deploy the new HTML and `ivoir-assets/` with the existing Express site. Its current
HTML-extension routing already serves the slug; no new backend route is needed.
Verify production event receipt in GA4 after deployment. Automated local checks:
`node --test tests/*.cjs`.

## Flavour landing pages

The IVOIR layout is also available at these independent URLs:

- `/frambolade`
- `/calibana`
- `/vaquero-rum-likeur`
- `/limoncello`
- `/gin-o-pomelo`

Pinacello and Cococello remain on the main page at `/`.

The new pages share `flavour-assets/landing.css`, with individual colours, copy, product photos and webshop destinations. Express serves each slug through its existing HTML-extension routing. GA4 uses each page's slug for `page_path`, `landing_page` and `product_id`; Clarity and Meta Pixel are included. Prices are labelled as regular prices; offers remain in the Wix shop. Photos and product details were checked against the Pinacello webshop on 26 September 2026. Product images are served from its Wix CDN. Unknown ABV/volume values are omitted rather than inferred.

## Homepage button experiment

`button-experiment.js` runs `hero_cta_copy_v1` on the homepage hero button only:
A = **Bestel de zomerfles** (original), B = **Ontdek jouw favoriet**. The design,
price, selected flavour and webshop destination stay unchanged. New browsers are
randomly assigned 50/50; localStorage retains the assignment for 90 days. Visitors
whose storage is unavailable keep the original button and are excluded from the test.
Clearing browser storage or using another device creates a new assignment.

`experiment_impression` fires once per page when at least half the button is in
view in a visible tab (or when activated). Existing `shop_click`, `begin_checkout`
and `generate_lead` events receive `experiment_id` and `variant_id` after exposure.
Hero clicks additionally receive `cta_placement: hero`. No duplicate click or
purchase events are generated. Existing production-only GA4 delivery still applies.

In GA4 property for **G-T758CLG2LQ**, register event-scoped custom dimensions:
- Experiment ID → `experiment_id`
- Variant ID → `variant_id`
- CTA placement → `cta_placement` (reuse it if already registered)

Compare unique users firing `shop_click` with `cta_placement = hero` against
unique users firing `experiment_impression`, filtered to `hero_cta_copy_v1` and
broken down by variant. Do not compare raw click totals or all visitors. Allow
24–48 hours for custom dimensions to become available in normal reporting.
Use at least two complete weekly cycles and sufficient sample size; a small
numerical lead does not establish a winner.

Purchase attribution requires GA4 user segments that start with the corresponding
experiment impression and then a Wix `purchase`, or audiences created before
launch with the same exposure condition. Wix must send real purchases to the same
property and preserve GA client identity across the landing page and checkout.
The landing page already configures the domain linker, but this alone does not
verify Wix checkout tracking. Event-scoped variant parameters do not automatically
transfer to Wix purchase events. Do not label outbound shop clicks as purchases.
GA reporting setup and cross-site purchase validation must be verified separately.

For local visual QA use `/?cta_variant=A` or `/?cta_variant=B`; overrides are ignored
on production and do not overwrite stored assignment locally. Stop the experiment
by setting `config.enabled` to `false`; this restores the original label and stops
experiment tagging. Increment the experiment ID before testing different copy.
Run `node --test tests/*.cjs` before publishing through the existing GitHub →
Railway deployment flow.
