import { NextResponse } from 'next/server';
import { getAllSiteSettings } from '@/lib/db';
import { generateRobotsTxt } from '@/lib/seo';

export async function GET() {
  try {
    const siteSettings = await getAllSiteSettings();
    const robotsTxt = generateRobotsTxt(siteSettings);
    
    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    // Fallback robots.txt if database is unavailable
    const fallbackRobots = `User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/sitemap.xml`;
    
    return new NextResponse(fallbackRobots, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
