// Direct checkout: /bestel?p=<shop slug>&q=<quantity>
// Creates a Wix eCommerce checkout for that product and redirects the buyer straight to the
// Wix checkout page, skipping the product page. Without Wix credentials, or when Wix fails,
// the buyer lands on the product page exactly as before, so a buy button never breaks.
//
// Railway environment variables (set them yourself, never in code):
//   WIX_API_KEY   API key from Wix (Settings > API Keys), permission "Manage eCommerce" + "Read Products"
//   WIX_SITE_ID   the site id of shop.pinacello.com (metaSiteId)

const SHOP = 'https://shop.pinacello.com';
const WIX = 'https://www.wixapis.com';
const STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

// Only products we actually link to can be ordered through this route.
const PRODUCTS = new Set([
  'kopie-van-pinacello-ananas-citroen-likeur-500ml', 'cococello', 'calibana', 'frambolade',
  'vaquero-rum-likeur', 'limoncello', 'gin-o-pomelo', 'ivoir-chocolade-whiskey',
  'pina-en-cococello-pakket', 'pina-en-limoncello-pakket-2-x-500-ml', 'cococello-en-ivoir-pakket-2-x-500-ml',
  'kerst-triopakket-pinacello-frambolade-calibana-3-x-500-ml',
]);

function createCheckout({ apiKey, siteId, fetchImpl = fetch, log = console } = {}) {
  const ids = new Map(); // slug -> Wix product id (product ids never change)
  const headers = () => ({ Authorization: apiKey, 'wix-site-id': siteId, 'Content-Type': 'application/json' });

  async function wix(method, path, body) {
    const r = await fetchImpl(WIX + path, {
      method, headers: headers(), body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) throw new Error(`${method} ${path} ${r.status}`);
    return r.json();
  }

  async function productId(slug) {
    if (ids.has(slug)) return ids.get(slug);
    let id;
    try { // Catalog V3 sites
      const v3 = await wix('POST', '/stores/v3/products/query', { query: { filter: { slug: { $eq: slug } } } });
      id = v3.products && v3.products[0] && v3.products[0]._id;
    } catch (e) { /* not a V3 catalog: try V1 */ }
    if (!id) {
      const v1 = await wix('POST', '/stores-reader/v1/products/query', { query: { filter: JSON.stringify({ slug }) } });
      id = v1.products && v1.products[0] && v1.products[0].id;
    }
    if (!id) throw new Error('product not found: ' + slug);
    ids.set(slug, id);
    return id;
  }

  return async function bestel(req, res) {
    const slug = String(req.query.p || '');
    if (!PRODUCTS.has(slug)) return res.redirect(302, SHOP + '/shop');
    const fallback = SHOP + '/product-page/' + slug;
    const quantity = Math.min(Math.max(parseInt(req.query.q, 10) || 1, 1), 24);
    res.set('Cache-Control', 'no-store');
    if (!apiKey || !siteId) return res.redirect(302, fallback);
    try {
      const catalogItemId = await productId(slug);
      const created = await wix('POST', '/ecom/v1/checkouts', {
        lineItems: [{ quantity, catalogReference: { catalogItemId, appId: STORES_APP_ID } }],
        channelType: 'WEB',
      });
      const checkoutId = created.checkout && created.checkout.id;
      if (!checkoutId) throw new Error('no checkout id');
      const { checkoutUrl } = await wix('GET', `/ecom/v1/checkouts/${checkoutId}/checkout-url`);
      if (!/^https:\/\//.test(checkoutUrl || '')) throw new Error('no checkout url');
      return res.redirect(302, checkoutUrl);
    } catch (e) {
      log.error('Direct checkout viel terug op productpagina', slug, e.message);
      return res.redirect(302, fallback);
    }
  };
}

module.exports = { createCheckout, PRODUCTS };
