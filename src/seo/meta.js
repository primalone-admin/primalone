// Search / AI metadata for every route: <title>, description, canonical, Open Graph, robots and
// JSON-LD. Used in the browser (SiteLayout keeps <head> in sync on navigation) and at build time
// (scripts/prerender.mjs writes it into each page's static HTML).
//
// Every fact here is read from the same data files the pages render (src/data/*), so structured
// data never drifts from what a visitor sees. Change copy in src/data, not here.
import { faq as homeFaq, footer, products } from '../data/content.js';
import {
  aboutPage, contactPage, faqPage, journalPage, legalPages, originPage, restorePage,
  sciencePage, sequencePage, shopPage,
} from '../data/pages.js';

export const SITE = 'https://primalone.in';
const BRAND = 'PrimalOne';
const OG_IMAGE = `${SITE}/og-image.jpg`;
const img = (name) => `${SITE}/img/${name}-1080.webp`;
const abs = (path) => (path === '/' ? `${SITE}/` : `${SITE}${path}`);
const inr = (n) => '₹' + n.toLocaleString('en-IN');

// Public, indexable routes (also drives sitemap.xml, llms.txt and the prerender list).
export const articles = journalPage.articles;
export const publicRoutes = [
  '/', '/shop', '/products/origin', '/products/restore', '/sequence', '/science', '/about',
  '/journal', ...articles.map((a) => `/journal/${a.slug}`), '/contact',
  '/shipping', '/returns', '/privacy', '/terms',
];

// Never indexed: signed-in, transactional and admin screens.
export const isPrivate = (path) => /^\/(admin|account|checkout)(\/|$)/.test(path);

const cheapestPerDay = Math.min(...Object.values(products).flatMap((p) => p.sizes.map((s) => s.perDay)));
const fromPrice = (p) => Math.min(...p.sizes.map((s) => s.price));

// ---------- JSON-LD building blocks ----------
const ORG_ID = `${SITE}/#org`;
const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: BRAND,
  legalName: 'Primalone Nutrition Pvt Ltd',
  url: `${SITE}/`,
  logo: `${SITE}/img/logo-wordmark.png`,
  slogan: "Sequence, don't stack.",
  description: aboutPage.lead,
  areaServed: 'IN',
  email: 'hello@primalone.in',
  sameAs: footer.socials.map((s) => s.href),
};
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: BRAND,
  inLanguage: 'en-IN',
  publisher: { '@id': ORG_ID },
};

const productPages = { origin: originPage, restore: restorePage };
function productLd(id) {
  const p = products[id];
  const page = productPages[id];
  const url = abs(`/products/${id}`);
  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: `${BRAND} ${p.name}`,
    url,
    image: [img(p.image.name), img(p.shopImage.name)],
    description: page.whatItIs,
    category: page.descriptor,
    brand: { '@type': 'Brand', name: BRAND },
    manufacturer: { '@id': ORG_ID },
    additionalProperty: p.contains.map((c) => ({ '@type': 'PropertyValue', name: 'Contains', value: c })),
    offers: p.sizes.map((s) => ({
      '@type': 'Offer',
      name: `${s.days}-day pack`,
      price: s.price.toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      seller: { '@id': ORG_ID },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
      },
    })),
  };
}

const faqLd = (items, url) => ({
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  mainEntity: items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
});

const crumbs = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...trail].map(([name, path], i) => ({
    '@type': 'ListItem', position: i + 1, name, item: abs(path),
  })),
});

const webPage = (path, title, description, type = 'WebPage') => ({
  '@type': type,
  '@id': `${abs(path)}#webpage`,
  url: abs(path),
  name: title,
  description,
  inLanguage: 'en-IN',
  isPartOf: { '@id': `${SITE}/#website` },
  publisher: { '@id': ORG_ID },
});

// ---------- per-route metadata ----------
// Fit a description into ~158 characters: whole sentences when possible, else cut at a word.
const clip = (s, n = 158) => {
  if (s.length <= n) return s;
  let out = '';
  for (const sentence of s.match(/[^.!?]+[.!?]+(\s|$)/g) || []) {
    if ((out + sentence).trim().length > n) break;
    out += sentence;
  }
  return out.trim() || s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:.]$/, '') + '…';
};
// Copied from src/data/legal.js so the policy text (~140 KB) stays out of the main bundle;
// scripts/prerender.mjs fails the build if these drift from legal.js.
export const legalDocs = {
  privacy: { kind: 'Privacy Policy', title: 'Privacy', lead: 'How Primalone Nutrition Private Limited collects, uses, discloses and protects your Personal Data when you use the PrimalOne website and app.' },
  returns: { kind: 'Return, Refund and Cancellation Policy', title: 'Returns', lead: 'When you can cancel an order, return a product or get a refund, the windows that apply and how we handle each request.' },
  terms: { kind: 'Terms and Conditions', title: 'Terms', lead: 'The User Agreement that applies when you browse the PrimalOne website, open an account or buy from Primalone Nutrition Private Limited.' },
};

const pages = {
  '/': {
    title: `${BRAND} | Daily Essentials Powder & Evening Recovery | India`,
    description: `Origin: greens, omega-3, D3+K2, minerals, CoQ10 and a probiotic in one morning scoop, from ${inr(cheapestPerDay)}/day. Restore: optional evening recovery. Sequence, don't stack.`,
    ogTitle: `${BRAND} | One scoop for the day you have`,
    ld: (m) => [webPage('/', m.title, m.description), productLd('origin'), productLd('restore'), faqLd(homeFaq.items, abs('/'))],
  },
  '/shop': {
    title: `Shop Origin & Restore | ${BRAND}`,
    description: `${shopPage.sub} Origin from ${inr(fromPrice(products.origin))}, Restore from ${inr(fromPrice(products.restore))}. 30-day and 15-day packs, delivered across India.`,
    ld: (m) => [
      webPage('/shop', m.title, m.description, 'CollectionPage'),
      { '@type': 'ItemList', itemListElement: ['origin', 'restore'].map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/products/${id}`), name: `${BRAND} ${products[id].name}` })) },
      crumbs([['Shop', '/shop']]),
    ],
  },
  '/products/origin': {
    ogImage: `${SITE}/og/origin.jpg`,
    title: `Origin: Daily Essentials Morning Scoop | ${BRAND}`,
    description: `Daily essentials in one 20 g morning scoop: omega-3s, vitamin D3 & K2, minerals, CoQ10, greens and a probiotic, with or after breakfast. From ${inr(fromPrice(products.origin))}.`,
    ld: (m) => [webPage('/products/origin', m.title, m.description, 'ItemPage'), productLd('origin'), faqLd(originPage.faq, abs('/products/origin')), crumbs([['Shop', '/shop'], ['Origin', '/products/origin']])],
  },
  '/products/restore': {
    ogImage: `${SITE}/og/restore.jpg`,
    title: `Restore: Evening Recovery Formula | ${BRAND}`,
    description: `Optional evening formula: glycine (3 g), NAC (600 mg), magnesium, KSM-66 ashwagandha and myo-inositol, 30–60 minutes before bed. From ${inr(fromPrice(products.restore))}.`,
    ld: (m) => [webPage('/products/restore', m.title, m.description, 'ItemPage'), productLd('restore'), faqLd(restorePage.faq, abs('/products/restore')), crumbs([['Shop', '/shop'], ['Restore', '/products/restore']])],
  },
  '/sequence': {
    title: `The Sequence: Origin in the Morning, Restore at Night | ${BRAND}`,
    description: `${sequencePage.sub} Why ${BRAND} sequences two products instead of stacking supplements.`,
    ld: (m) => [webPage('/sequence', m.title, m.description), crumbs([['Sequence', '/sequence']])],
  },
  '/science': {
    title: `Science: Timing Over Quantity | ${BRAND}`,
    description: `${sciencePage.sub} How Origin's morning nutrients and Restore's evening ingredients are separated by time of day.`,
    ld: (m) => [webPage('/science', m.title, m.description), crumbs([['Science', '/science']])],
  },
  '/about': {
    title: `About ${BRAND} | Nutrition Should Evolve as You Do`,
    description: clip(aboutPage.lead),
    ld: (m) => [webPage('/about', m.title, m.description, 'AboutPage'), crumbs([['About', '/about']])],
  },
  '/journal': {
    title: `Journal: Sequencing, Mornings & Evening Recovery | ${BRAND}`,
    description: clip(journalPage.sub),
    ld: (m) => [
      webPage('/journal', m.title, m.description, 'CollectionPage'),
      { '@type': 'Blog', '@id': `${abs('/journal')}#blog`, name: `${BRAND} Journal`, url: abs('/journal'), publisher: { '@id': ORG_ID },
        blogPost: articles.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: abs(`/journal/${a.slug}`) })) },
      crumbs([['Journal', '/journal']]),
    ],
  },
  '/contact': {
    title: `Help, FAQs & Contact | ${BRAND}`,
    description: clip(`${contactPage.lead} ${faqPage.sub}`),
    ld: (m) => [webPage('/contact', m.title, m.description, 'ContactPage'), faqLd(faqPage.groups.flatMap((g) => g.items), abs('/contact')), crumbs([['Contact', '/contact']])],
  },
  '/shipping': {
    title: `Shipping & Delivery Policy | ${BRAND}`,
    description: clip(`${legalPages.shipping.lead} Delivery anywhere in India, estimated within 14 working days of payment.`),
    ld: (m) => [webPage('/shipping', m.title, m.description), crumbs([['Shipping', '/shipping']])],
  },
};
for (const [slug, doc] of Object.entries(legalDocs)) {
  pages[`/${slug}`] = {
    title: `${doc.kind} | ${BRAND}`,
    description: clip(doc.lead),
    ld: (m) => [webPage(`/${slug}`, m.title, m.description), crumbs([[doc.title, `/${slug}`]])],
  };
}
for (const a of articles) {
  const path = `/journal/${a.slug}`;
  pages[path] = {
    title: `${a.title} | ${BRAND} Journal`,
    description: clip(a.open),
    ogType: 'article',
    ogImage: `${SITE}/og/journal-${a.slug}.jpg`,
    ld: (m) => [
      webPage(path, m.title, m.description),
      { '@type': 'BlogPosting', '@id': `${abs(path)}#article`, headline: a.title, description: m.description,
        articleSection: a.topic, image: img(a.image), url: abs(path), mainEntityOfPage: abs(path),
        inLanguage: 'en-IN', author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID },
        articleBody: a.body.join('\n\n') },
      crumbs([['Journal', '/journal'], [a.title, path]]),
    ],
  };
}

const privateTitles = { '/account/sign-in': 'Sign in', '/account': 'Your account', '/checkout': 'Checkout' };

// Metadata for any pathname. Unknown public paths fall back to the homepage's canonical.
export function metaFor(rawPath) {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  if (isPrivate(path)) {
    const key = Object.keys(privateTitles).find((k) => path === k || (k !== '/account/sign-in' && path.startsWith(k)));
    return { path, title: `${privateTitles[key] || 'Your account'} | ${BRAND}`, description: pages['/'].description, robots: 'noindex, nofollow', canonical: null, ld: [] };
  }
  const page = pages[path];
  if (!page) return { ...metaFor('/'), path, robots: 'noindex, follow' };
  const m = {
    path,
    title: page.title,
    description: page.description,
    canonical: abs(path),
    robots: 'index, follow, max-image-preview:large',
    ogType: page.ogType || 'website',
    ogTitle: page.ogTitle || page.title,
    image: page.ogImage || OG_IMAGE,
  };
  m.ld = [organization, website, ...page.ld(m)];
  return m;
}

export const jsonLd = (m) => (m.ld.length ? { '@context': 'https://schema.org', '@graph': m.ld } : null);
