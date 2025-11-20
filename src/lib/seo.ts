import type { Metadata } from 'next';
import type { SEOData, PageSEOData, SiteSettings, StructuredData, Topic, Category, User } from './types';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

/**
 * Generate friendly URLs based on SEO settings
 */
export function generateFriendlyUrl(type: 'topic' | 'category' | 'user', item: Topic | Category | User, settings: SiteSettings): string {
  if (!settings.seo_friendly_urls_enabled) {
    // Return ID-based URLs when friendly URLs are disabled
    switch (type) {
      case 'topic':
        return `/topics/${(item as Topic).id}`;
      case 'category':
        return `/categories/${(item as Category).id}`;
      case 'user':
        return `/users/${(item as User).username}`;
      default:
        return '/';
    }
  }

  // Generate friendly URLs using slugs/names
  switch (type) {
    case 'topic':
      const topic = item as Topic;
      return `/topics/${topic.slug || topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    case 'category':
      const category = item as Category;
      return `/categories/${category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    case 'user':
      const user = item as User;
      return `/users/${user.username}`;
    default:
      return '/';
  }
}

/**
 * Generate metadata for a page using SEO data and site settings
 */
export function generatePageMetadata(
  seoData: SEOData,
  siteSettings: SiteSettings,
  locale?: string
): Metadata {
  const {
    title,
    description,
    keywords,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary',
    canonicalUrl,
    noIndex = false,
    noFollow = false,
  } = seoData;

  const siteTitle = siteSettings.seo_site_title || 'Rexerium Forum - Light Forum Solution';
  const siteDescription = siteSettings.seo_site_description || 'Conversations Made Simple. A simple, efficient platform for community building.';
  const siteKeywords = siteSettings.seo_site_keywords || 'forum, community, discussion';
  const defaultOgImage = siteSettings.seo_og_image || `${baseUrl}/og-default.png`;
  const twitterHandle = siteSettings.seo_twitter_handle;

  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  const fullDescription = description || siteDescription;
  const fullKeywords = keywords ? `${keywords}, ${siteKeywords}` : siteKeywords;
  const fullOgImage = ogImage || defaultOgImage;
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  const robots = [];
  if (noIndex) robots.push('noindex');
  if (noFollow) robots.push('nofollow');
  if (!noIndex && !noFollow) robots.push('index', 'follow');

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    robots: robots.length > 0 ? robots.join(', ') : undefined,
    alternates: {
      canonical: fullCanonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      type: ogType,
      url: fullCanonicalUrl,
      siteName: siteTitle,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description: fullDescription,
      images: [fullOgImage],
      ...(twitterHandle && { creator: `@${twitterHandle}` }),
    },
  };

  // Add locale-specific metadata if provided
  if (locale) {
    metadata.alternates = {
      ...metadata.alternates,
      languages: {
        'en': '/en',
        'de': '/de',
      },
    };
  }

  return metadata;
}

/**
 * Generate structured data for different page types
 */
export function generateStructuredData(
  type: 'website' | 'article' | 'forum' | 'user' | 'category' | 'topic',
  data: any,
  siteSettings: SiteSettings
): StructuredData[] {
  const structuredData: StructuredData[] = [];

  const siteTitle = siteSettings.seo_site_title || 'Rexerium Forum - Light Forum Solution';
  const siteDescription = siteSettings.seo_site_description || 'Conversations Made Simple. A simple, efficient platform for community building.';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  // Website/Organization structured data
  if (type === 'website') {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteTitle,
      description: siteDescription,
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteTitle,
      description: siteDescription,
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
    });
  }

  // Article structured data
  if (type === 'article' && data) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description || data.content?.substring(0, 160),
      author: {
        '@type': 'Person',
        name: data.author?.username || 'Anonymous',
        url: data.author?.id ? `${baseUrl}/users/${data.author.username}` : undefined,
      },
      publisher: {
        '@type': 'Organization',
        name: siteTitle,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      datePublished: data.createdAt,
      dateModified: data.updatedAt || data.createdAt,
      url: `${baseUrl}${data.url}`,
      ...(data.image && { image: data.image }),
    });
  }

  // Forum structured data
  if (type === 'forum' && data) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: data.title,
      description: data.description || data.content?.substring(0, 160),
      author: {
        '@type': 'Person',
        name: data.author?.username || 'Anonymous',
      },
      datePublished: data.createdAt,
      dateModified: data.updatedAt || data.createdAt,
      url: `${baseUrl}${data.url}`,
      isPartOf: {
        '@type': 'WebSite',
        name: siteTitle,
        url: baseUrl,
      },
    });
  }

  // User profile structured data
  if (type === 'user' && data) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: data.username,
      description: data.aboutMe || `Profile page for ${data.username}`,
      url: `${baseUrl}/users/${data.username}`,
      mainEntity: {
        '@type': 'Person',
        name: data.username,
        description: data.aboutMe,
        ...(data.avatarUrl && { image: data.avatarUrl }),
      },
    });
  }

  return structuredData;
}

/**
 * Generate sitemap data
 */
export async function generateSitemapData(
  siteSettings: SiteSettings,
  categories: any[],
  topics: any[],
  users: any[]
): Promise<any[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  const sitemapData = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Add categories (flatten parent/children)
  const flatCategories = Array.isArray(categories) ? categories.flatMap((c: any) => [c, ...(c.children || [])]) : [];
  flatCategories.forEach((category: any) => {
    const categoryUrl = siteSettings.seo_friendly_urls_enabled 
      ? generateFriendlyUrl('category', category, siteSettings)
      : `/categories/${category.id}`;
    sitemapData.push({
      url: `${baseUrl}${categoryUrl}`,
      lastModified: category.updatedAt || category.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Add topics
  topics.forEach((topic) => {
    const topicUrl = siteSettings.seo_friendly_urls_enabled 
      ? generateFriendlyUrl('topic', topic, siteSettings)
      : `/topics/${topic.id}`;
    sitemapData.push({
      url: `${baseUrl}${topicUrl}`,
      lastModified: topic.updatedAt || topic.createdAt,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  });

  // Add user profiles
  users.forEach((user) => {
    const userUrl = siteSettings.seo_friendly_urls_enabled 
      ? generateFriendlyUrl('user', user, siteSettings)
      : `/users/${user.username}`;
    sitemapData.push({
      url: `${baseUrl}${userUrl}`,
      lastModified: user.updatedAt || user.createdAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  });

  return sitemapData;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(siteSettings: SiteSettings): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  const customRobots = siteSettings.seo_robots_txt || 'User-agent: *\nAllow: /';
  
  let robotsTxt = customRobots;
  
  if (siteSettings.seo_sitemap_enabled) {
    robotsTxt += `\nSitemap: ${baseUrl}/sitemap.xml`;
  }
  
  return robotsTxt;
}

/**
 * Generate JSON-LD structured data script
 */
export function generateJsonLdScript(structuredData: StructuredData[]): string {
  if (structuredData.length === 0) return '';
  
  const jsonLd = structuredData.length === 1 ? structuredData[0] : structuredData;
  return JSON.stringify(jsonLd, null, 2);
}
