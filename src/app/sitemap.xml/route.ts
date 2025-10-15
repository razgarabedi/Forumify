import { NextResponse } from 'next/server';
import { getAllSiteSettings, getCategories, getTopics, getAllUsers } from '@/lib/db';
import { generateSitemapData } from '@/lib/seo';

export async function GET() {
  try {
    const siteSettings = await getAllSiteSettings();
    
    // Only generate sitemap if enabled
    if (!siteSettings.seo_sitemap_enabled) {
      return new NextResponse('Sitemap disabled', { status: 404 });
    }

    // Fetch data for sitemap
    const [categories, topics, users] = await Promise.all([
      getCategories(),
      getTopics(),
      getAllUsers(),
    ]);

    const sitemapData = await generateSitemapData(categories, topics, users);

    // Generate XML sitemap
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapData.map(item => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
