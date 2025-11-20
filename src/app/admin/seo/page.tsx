import { getAllSiteSettings } from "@/lib/db";
import { SEOForm } from "./_components/SEOForm";
import { Search, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SEO Settings - Admin Panel',
};

export default async function AdminSEOPage() {
  let initialSettings;
  let error: string | null = null;

  try {
    initialSettings = await getAllSiteSettings();
  } catch (e: any) {
    error = "Failed to load SEO settings. " + e.message;
    console.error(error);
    // Initialize with defaults if fetching fails, so the form can still render
    initialSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
        events_widget_item_count: 3,
        events_widget_title: "Upcoming Events & Webinars",
        multilingual_enabled: false,
        default_language: 'en',
        // SEO Defaults
        seo_site_title: "Rexerium Forum - Light Forum Solution",
        seo_site_description: "Conversations Made Simple. A simple, efficient platform for community building. Perfect for small communities, startups, open-source projects, and niche groups.",
        seo_site_keywords: "forum, community, discussion, topics, posts, social",
        seo_og_image: "",
        seo_twitter_handle: "",
        seo_google_analytics_id: "",
        seo_google_site_verification: "",
        seo_bing_site_verification: "",
        seo_robots_txt: "User-agent: *\nAllow: /",
        seo_sitemap_enabled: true,
        seo_friendly_urls_enabled: false,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">SEO Settings</h1>
      </div>
      <p className="text-muted-foreground">Configure search engine optimization settings for your forum.</p>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Settings</h3>
          </div>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Default settings will be used for the form.</p>
        </div>
      )}

      <SEOForm initialSettings={initialSettings} />
    </div>
  );
}
