
import { ThemeToggler } from './ThemeToggler';
import { getAllSiteSettings } from '@/lib/db';
import { Twitter, Globe, Map, BookOpen, Users } from 'lucide-react';

export async function Footer() {
  let siteSettings;
  try {
    siteSettings = await getAllSiteSettings();
  } catch (error) {
    // Fallback to default values if database is unavailable
    siteSettings = {
      seo_twitter_handle: '',
      seo_og_image: '',
      seo_sitemap_enabled: true,
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ForumLite. All rights reserved.
            </p>
            
            {/* Social Media Links */}
            {(siteSettings.seo_twitter_handle || siteSettings.seo_og_image) && (
              <div className="flex items-center gap-3">
                {siteSettings.seo_twitter_handle && (
                  <a
                    href={`https://twitter.com/${siteSettings.seo_twitter_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="hidden sm:inline">@{siteSettings.seo_twitter_handle.replace('@', '')}</span>
                  </a>
                )}
                {siteSettings.seo_og_image && (
                  <a
                    href={siteSettings.seo_og_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Website</span>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sitemap Link */}
            {siteSettings.seo_sitemap_enabled && (
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                title="XML Sitemap"
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Sitemap</span>
              </a>
            )}

            {/* Docs Link */}
            {siteSettings.links_docs_url && (
              <a
                href={siteSettings.links_docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                title="Documentation"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Docs</span>
              </a>
            )}

            {/* Community Link */}
            {siteSettings.links_community_url && (
              <a
                href={siteSettings.links_community_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                title="Community"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Community</span>
              </a>
            )}
            
            <ThemeToggler />
          </div>
        </div>
      </div>
    </footer>
  );
}
