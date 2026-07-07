import { GetServerSideProps } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { slugify } from '@/lib/slugify';

// ─────────────────────────────────────────────────────────────────
// SITE CONFIG
// ─────────────────────────────────────────────────────────────────
const SITE_URL = 'https://jyotimehendi.in';
const TODAY    = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────
// KNOWN SERVICE SLUGS  (keep in sync with Firestore / services page)
// ─────────────────────────────────────────────────────────────────
const SERVICE_SLUGS = [
  'bridal-mehndi-agra',
  'arabic-mehndi-agra',
  'guest-party-mehndi-agra',
  'indo-western-mehndi-agra',
  'rajasthani-mehndi-agra',
  'moroccan-mehndi-agra',
  'full-hand-mehndi-agra',
  'feet-mehndi-agra',
];

// ─────────────────────────────────────────────────────────────────
// KNOWN PACKAGE SLUGS
// ─────────────────────────────────────────────────────────────────
const PACKAGE_SLUGS = [
  'royal-bridal-package-agra',
  'budget-bridal-package-agra',
  'premium-wedding-package-agra',
  'engagement-mehndi-package-agra',
  'karwa-chauth-mehndi-agra',
  'full-wedding-family-package-agra',
];

// ─────────────────────────────────────────────────────────────────
// AGRA LOCALITY LANDING PAGES  (keyword-rich geo pages)
// ─────────────────────────────────────────────────────────────────
const LOCALITY_PAGES = [
  'mehndi-artist-tajganj-agra',
  'mehndi-artist-sanjay-place-agra',
  'mehndi-artist-kamla-nagar-agra',
  'mehndi-artist-dayalbagh-agra',
  'mehndi-artist-sikandra-agra',
  'mehndi-artist-khandari-agra',
  'mehndi-artist-shahganj-agra',
  'mehndi-artist-fatehabad-road-agra',
  'mehndi-artist-lohamandi-agra',
  'mehndi-artist-shastripuram-agra',
  'mehndi-artist-bodla-agra',
  'mehndi-artist-prakash-nagar-agra',
  'mehndi-artist-nehru-nagar-agra',
  'mehndi-artist-civil-lines-agra',
  'mehndi-artist-sadar-bazar-agra',
  'mehndi-artist-belanganj-agra',
  'mehndi-artist-hariparvat-agra',
  'mehndi-artist-mant-road-agra',
  'mehndi-artist-raj-nagar-agra',
];

// ─────────────────────────────────────────────────────────────────
// KEYWORD-TARGETED STATIC PAGES
// Each entry: [route, changefreq, priority, lastmod override?]
// ─────────────────────────────────────────────────────────────────
const STATIC_PAGES: Array<{
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
  images?: Array<{ loc: string; title: string; caption: string }>;
}> = [
  // ── Homepage ───────────────────────────────────────────────────
  {
    loc: '',
    changefreq: 'daily',
    priority: '1.0',
    images: [
      {
        loc: `${SITE_URL}/images/services/bridal.png`,
        title: 'Best Bridal Mehndi Artist in Agra - Jyoti Mehendi',
        caption: 'Royal bridal mehndi designs by Jyoti Mehendi Artist Agra',
      },
      {
        loc: `${SITE_URL}/images/services/arabic.png`,
        title: 'Arabic Mehndi Artist in Agra',
        caption: 'Premium Arabic and floral henna designs in Agra',
      },
    ],
  },

  // ── High-value booking pages ───────────────────────────────────
  { loc: '/booking',          changefreq: 'daily',   priority: '0.95' },
  { loc: '/express-booking',  changefreq: 'daily',   priority: '0.93' },
  { loc: '/custom-package',   changefreq: 'weekly',  priority: '0.90' }, // Custom Package builder

  // ── Service & Package catalogue ────────────────────────────────
  { loc: '/services',   changefreq: 'weekly', priority: '0.90' },
  { loc: '/packages',   changefreq: 'weekly', priority: '0.90' },
  { loc: '/offers',     changefreq: 'daily',  priority: '0.88' },
  { loc: '/gift-cards', changefreq: 'weekly', priority: '0.80' },

  // ── Social proof & discovery ───────────────────────────────────
  { loc: '/gallery',   changefreq: 'weekly', priority: '0.85' },
  { loc: '/reviews',   changefreq: 'daily',  priority: '0.82' },
  { loc: '/blog',      changefreq: 'daily',  priority: '0.80' },

  // ── Business pages ─────────────────────────────────────────────
  { loc: '/partner',          changefreq: 'monthly', priority: '0.65' },
  { loc: '/partner-register', changefreq: 'monthly', priority: '0.60' },

  // ── Legal ──────────────────────────────────────────────────────
  { loc: '/privacy', changefreq: 'yearly', priority: '0.30' },
  { loc: '/terms',   changefreq: 'yearly', priority: '0.30' },
];

// ─────────────────────────────────────────────────────────────────
// XML BUILDER HELPERS
// ─────────────────────────────────────────────────────────────────
function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  images?: Array<{ loc: string; title: string; caption: string }>
): string {
  const imgTags = images
    ? images
        .map(
          (img) => `
      <image:image>
        <image:loc>${img.loc}</image:loc>
        <image:title>${img.title}</image:title>
        <image:caption>${img.caption}</image:caption>
      </image:image>`
        )
        .join('')
    : '';

  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imgTags}
  </url>`;
}

// Helper to parse mix of string dates, Firestore Timestamps and date objects safely
function parseLastMod(dateVal: any): string {
  if (!dateVal) return TODAY;
  if (typeof dateVal === 'string') return dateVal;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (e) {}
  return TODAY;
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const entries: string[] = [];

    // 1. Static pages
    for (const page of STATIC_PAGES) {
      entries.push(
        urlEntry(
          `${SITE_URL}${page.loc}`,
          page.lastmod ?? TODAY,
          page.changefreq,
          page.priority,
          page.images
        )
      );
    }

    // 2. Known service slugs
    for (const slug of SERVICE_SLUGS) {
      entries.push(
        urlEntry(
          `${SITE_URL}/services/${slug}`,
          TODAY,
          'weekly',
          '0.88'
        )
      );
    }

    // 3. Known package slugs
    for (const slug of PACKAGE_SLUGS) {
      entries.push(
        urlEntry(
          `${SITE_URL}/packages/${slug}`,
          TODAY,
          'weekly',
          '0.85'
        )
      );
    }

    // 4. Locality landing pages (geo-SEO keyword pages)
    for (const slug of LOCALITY_PAGES) {
      entries.push(
        urlEntry(
          `${SITE_URL}/services/${slug}`,
          TODAY,
          'monthly',
          '0.78'
        )
      );
    }

    // 5. Dynamic blog posts from Firestore
    if (adminDb) {
      const blogsSnap = await adminDb
        .collection('blogs')
        .where('published', '==', true)
        .get();

      blogsSnap.forEach((doc) => {
        const blog = doc.data();
        if (blog.slug) {
          const lastmod = parseLastMod(blog.updatedAt || blog.createdAt);
          const imgUrl = blog.coverImage && blog.coverImage.startsWith('http') 
            ? blog.coverImage 
            : `${SITE_URL}${blog.coverImage || '/images/services/minimalist.png'}`;
          
          entries.push(
            urlEntry(
              `${SITE_URL}/blog/${blog.slug}`,
              lastmod,
              'weekly',
              '0.75',
              [{
                loc: imgUrl,
                title: `${blog.title} - Jyoti Mehendi Blog`,
                caption: blog.excerpt || `${blog.title} article about mehndi trends`
              }]
            )
          );
        }
      });

      // 6. Dynamic service pages from Firestore
      const servicesSnap = await adminDb.collection('services').get();
      servicesSnap.forEach((doc) => {
        const svc = doc.data();
        const serviceSlug = svc.title ? slugify(svc.title) : null;
        if (serviceSlug && svc.isActive !== false) {
          const serviceImg = svc.image || '/images/services/minimalist.png';
          const imgUrl = serviceImg.startsWith('http') ? serviceImg : `${SITE_URL}${serviceImg}`;
          
          entries.push(
            urlEntry(
              `${SITE_URL}/services/${serviceSlug}`,
              TODAY,
              'weekly',
              '0.87',
              [{
                loc: imgUrl,
                title: `${svc.title} - Best Mehndi Design in Agra`,
                caption: svc.description || `${svc.title} mehndi design by Jyoti Mehendi`
              }]
            )
          );
        }
      });

      // 7. Dynamic package pages from Firestore
      const packagesSnap = await adminDb.collection('event_packages').get();
      packagesSnap.forEach((doc) => {
        const pkg = doc.data();
        const packageSlug = pkg.name ? slugify(pkg.name) : null;
        if (packageSlug && pkg.isActive !== false) {
          const pkgImg = '/images/gallery/bridal_2.png'; // standard package cover
          
          entries.push(
            urlEntry(
              `${SITE_URL}/packages/${packageSlug}`,
              TODAY,
              'weekly',
              '0.84',
              [{
                loc: `${SITE_URL}${pkgImg}`,
                title: `${pkg.name} - Exclusive Event Package in Agra`,
                caption: pkg.description || `${pkg.name} design package details`
              }]
            )
          );
        }
      });
    }

    // Build final XML with full Google Image & News namespace
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml; charset=UTF-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=7200, stale-while-revalidate=3600'
    );
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.setHeader('Content-Type', 'text/xml');
    res.write(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
    res.end();
    return { props: {} };
  }
};

export default function SitemapPage() {
  return null;
}
