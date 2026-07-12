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
