# Pinacello — landing page

High-conversion one-page landing site for Pinacello ambachtelijke likeuren (Dilbeek, België).

Single, self-contained `index.html` (no build step) with a flavor switcher, bundle offers,
market photos, craft story, reviews, FAQ and a 5%-korting e-mailpopup.

## Structure
- `index.html` — the full page (HTML + inline CSS + JS)
- `markets/` — photos of the brothers at markets & events
- `craft/` — photos for the "100% zelfgemaakt" section

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
