import { GetServerSideProps } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

// Define the absolute URL of the website
const SITE_URL = 'https://jyotimehendi.in';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // 1. Define Static User-Facing Routes
    const staticRoutes = [
      '',
      '/services',
      '/gallery',
      '/offers',
      '/packages',
      '/blog',
      '/partner',
      '/express-booking',
      '/booking',
      '/reviews'
    ];

    const sitemapEntries = staticRoutes.map(route => {
      return `
        <url>
          <loc>${SITE_URL}${route}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>${route === '' ? '1.0' : '0.8'}</priority>
        </url>
      `;
    });

    // 2. Fetch Dynamic Blog Routes from Firestore
    if (adminDb) {
      const blogsSnapshot = await adminDb
        .collection('blogs')
        .where('published', '==', true)
        .get();

      blogsSnapshot.forEach(doc => {
        const blog = doc.data();
        if (blog.slug) {
          sitemapEntries.push(`
            <url>
              <loc>${SITE_URL}/blog/${blog.slug}</loc>
              <lastmod>${blog.updatedAt ? new Date(blog.updatedAt._seconds * 1000).toISOString() : new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.7</priority>
            </url>
          `);
        }
      });
    }

    // 3. Construct the XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${sitemapEntries.join('')}
      </urlset>
    `;

    // 4. Send Response
    res.setHeader('Content-Type', 'text/xml');
    // Cache the sitemap for 1 hour at the edge
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return empty sitemap on error to avoid completely breaking the route
    res.setHeader('Content-Type', 'text/xml');
    res.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    res.end();
    return { props: {} };
  }
};

// Next.js pages component must be exported, even if empty
export default function Sitemap() {
  return null;
}
