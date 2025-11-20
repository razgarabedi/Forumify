"use client";

import { useActionState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSEOSettingsAction } from '@/lib/actions/admin';
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionResponse, SiteSettings } from '@/lib/types';
import { Search, Globe, Twitter, BarChart3, Shield, FileText, Map } from 'lucide-react';

interface SEOFormProps {
  initialSettings: SiteSettings;
}

const initialActionState: ActionResponse = {
    message: '',
    errors: {},
    success: false,
    rawData: null,
};

// Helper type for raw form data expected from action state
type RawSEOSettingsData = {
  seo_site_title?: string | null;
  seo_site_description?: string | null;
  seo_site_keywords?: string | null;
  seo_og_image?: string | null;
  seo_twitter_handle?: string | null;
  seo_google_analytics_id?: string | null;
  seo_google_site_verification?: string | null;
  seo_bing_site_verification?: string | null;
  seo_robots_txt?: string | null;
  seo_sitemap_enabled?: string | null;
  seo_friendly_urls_enabled?: string | null;
};

export function SEOForm({ initialSettings }: SEOFormProps) {
  const [state, formAction, isPending] = useActionState(updateSEOSettingsAction, initialActionState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const sitemapHiddenRef = useRef<HTMLInputElement>(null);
  const friendlyHiddenRef = useRef<HTMLInputElement>(null);

  const currentRawData = state?.rawData as RawSEOSettingsData | undefined;

  useEffect(() => {
    const hasMeaningfulMessage = state.message && state.message !== '';
    const hasMeaningfulErrors = state.errors && Object.keys(state.errors).length > 0;

    if (state.success && hasMeaningfulMessage) {
      toast({ title: "Success", description: state.message });
    } else if (!state.success && (hasMeaningfulMessage || hasMeaningfulErrors)) {
      let description = state.message || "An error occurred.";
      if (hasMeaningfulErrors && state.errors) {
          const errorMessages = Object.entries(state.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
          description = `Validation failed: ${errorMessages || 'Please check your inputs.'}`;
      }
      toast({ variant: "destructive", title: "Error updating SEO settings", description });
    }
  }, [state, toast]);

  const getDefaultValue = (key: keyof RawSEOSettingsData) => {
    if (state.errors && currentRawData?.[key] !== undefined && currentRawData?.[key] !== null) {
      return currentRawData[key];
    }
    return initialSettings[key as keyof SiteSettings] || '';
  };

  const getSwitchDefaultChecked = (key: keyof RawSEOSettingsData) => {
    if (state.errors && currentRawData?.[key] !== undefined && currentRawData?.[key] !== null) {
      return String(currentRawData[key]).toLowerCase() === 'true';
    }
    return Boolean(initialSettings[key as keyof SiteSettings]);
  };

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
      {/* Basic SEO Settings */}
      <Card className="shadow-md border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <Search className="mr-2 h-5 w-5 text-primary"/>
            Basic SEO Settings
          </CardTitle>
          <CardDescription>
            Configure the basic search engine optimization settings for your forum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="seo_site_title">Site Title</Label>
              <Input
                id="seo_site_title"
                name="seo_site_title"
                type="text"
                maxLength={60}
                key="seo_site_title"
                defaultValue={getDefaultValue('seo_site_title')}
                disabled={isPending}
                placeholder="Rexerium Forum - Light Forum Solution"
                aria-describedby="title-error"
              />
              <p className="text-xs text-muted-foreground">Recommended: 50-60 characters</p>
              {state?.errors?.seo_site_title && <p id="title-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_site_title === 'string' ? state.errors.seo_site_title : state.errors.seo_site_title?.[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_site_description">Site Description</Label>
              <Textarea
                id="seo_site_description"
                name="seo_site_description"
                maxLength={160}
                key="seo_site_description"
                defaultValue={getDefaultValue('seo_site_description')}
                disabled={isPending}
                placeholder="Conversations Made Simple. A simple, efficient platform for community building. Perfect for small communities, startups, open-source projects, and niche groups."
                aria-describedby="description-error"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
              {state?.errors?.seo_site_description && <p id="description-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_site_description === 'string' ? state.errors.seo_site_description : state.errors.seo_site_description?.[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_site_keywords">Keywords</Label>
              <Input
                id="seo_site_keywords"
                name="seo_site_keywords"
                type="text"
                maxLength={200}
                key="seo_site_keywords"
                defaultValue={getDefaultValue('seo_site_keywords')}
                disabled={isPending}
                placeholder="forum, community, discussion, topics, posts, social"
                aria-describedby="keywords-error"
              />
              <p className="text-xs text-muted-foreground">Comma-separated keywords (optional)</p>
              {state?.errors?.seo_site_keywords && <p id="keywords-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_site_keywords === 'string' ? state.errors.seo_site_keywords : state.errors.seo_site_keywords?.[0]}</p>}
            </div>
          </CardContent>
      </Card>

      {/* Social Media & Open Graph */}
      <Card className="shadow-md border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <Globe className="mr-2 h-5 w-5 text-primary"/>
            Social Media & Open Graph
          </CardTitle>
          <CardDescription>
            Configure how your forum appears when shared on social media platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="seo_og_image">Open Graph Image URL</Label>
            <Input
              id="seo_og_image"
              name="seo_og_image"
              type="url"
              key="seo_og_image"
              defaultValue={getDefaultValue('seo_og_image')}
              disabled={isPending}
              placeholder="https://example.com/og-image.png"
              aria-describedby="og-image-error"
            />
            <p className="text-xs text-muted-foreground">Recommended: 1200x630px image</p>
            {state?.errors?.seo_og_image && <p id="og-image-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_og_image === 'string' ? state.errors.seo_og_image : state.errors.seo_og_image?.[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_twitter_handle">Twitter Handle</Label>
            <Input
              id="seo_twitter_handle"
              name="seo_twitter_handle"
              type="text"
              key="seo_twitter_handle"
              defaultValue={getDefaultValue('seo_twitter_handle')}
              disabled={isPending}
              placeholder="@yourhandle"
              aria-describedby="twitter-error"
            />
            <p className="text-xs text-muted-foreground">Your Twitter handle without @ symbol</p>
            {state?.errors?.seo_twitter_handle && <p id="twitter-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_twitter_handle === 'string' ? state.errors.seo_twitter_handle : state.errors.seo_twitter_handle?.[0]}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Tracking */}
      <Card className="shadow-md border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <BarChart3 className="mr-2 h-5 w-5 text-primary"/>
            Analytics & Tracking
          </CardTitle>
          <CardDescription>
            Configure analytics and tracking services for your forum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="seo_google_analytics_id">Google Analytics ID</Label>
            <Input
              id="seo_google_analytics_id"
              name="seo_google_analytics_id"
              type="text"
              key="seo_google_analytics_id"
              defaultValue={getDefaultValue('seo_google_analytics_id')}
              disabled={isPending}
              placeholder="G-XXXXXXXXXX"
              aria-describedby="ga-error"
            />
            <p className="text-xs text-muted-foreground">Your Google Analytics 4 measurement ID</p>
            {state?.errors?.seo_google_analytics_id && <p id="ga-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_google_analytics_id === 'string' ? state.errors.seo_google_analytics_id : state.errors.seo_google_analytics_id?.[0]}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Search Engine Verification */}
      <Card className="shadow-md border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <Shield className="mr-2 h-5 w-5 text-primary"/>
            Search Engine Verification
          </CardTitle>
          <CardDescription>
            Verify your site ownership with search engines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="seo_google_site_verification">Google Search Console</Label>
            <Input
              id="seo_google_site_verification"
              name="seo_google_site_verification"
              type="text"
              key="seo_google_site_verification"
              defaultValue={getDefaultValue('seo_google_site_verification')}
              disabled={isPending}
              placeholder="google-site-verification=..."
              aria-describedby="google-verification-error"
            />
            <p className="text-xs text-muted-foreground">Google Search Console verification meta tag content</p>
            {state?.errors?.seo_google_site_verification && <p id="google-verification-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_google_site_verification === 'string' ? state.errors.seo_google_site_verification : state.errors.seo_google_site_verification?.[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_bing_site_verification">Bing Webmaster Tools</Label>
            <Input
              id="seo_bing_site_verification"
              name="seo_bing_site_verification"
              type="text"
              key="seo_bing_site_verification"
              defaultValue={getDefaultValue('seo_bing_site_verification')}
              disabled={isPending}
              placeholder="msvalidate.01=..."
              aria-describedby="bing-verification-error"
            />
            <p className="text-xs text-muted-foreground">Bing Webmaster Tools verification meta tag content</p>
            {state?.errors?.seo_bing_site_verification && <p id="bing-verification-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_bing_site_verification === 'string' ? state.errors.seo_bing_site_verification : state.errors.seo_bing_site_verification?.[0]}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="shadow-md border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <FileText className="mr-2 h-5 w-5 text-primary"/>
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Configure advanced SEO settings including robots.txt and sitemap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="seo_robots_txt">Robots.txt Content</Label>
            <Textarea
              id="seo_robots_txt"
              name="seo_robots_txt"
              key="seo_robots_txt"
              defaultValue={getDefaultValue('seo_robots_txt')}
              disabled={isPending}
              placeholder="User-agent: *&#10;Allow: /"
              aria-describedby="robots-error"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Custom robots.txt content (optional)</p>
            {state?.errors?.seo_robots_txt && <p id="robots-error" className="text-sm font-medium text-destructive">{typeof state.errors.seo_robots_txt === 'string' ? state.errors.seo_robots_txt : state.errors.seo_robots_txt?.[0]}</p>}
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="seo_sitemap_enabled" className="flex flex-col space-y-1">
              <span>Enable Sitemap</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Generate and serve an XML sitemap for search engines. When enabled, your sitemap will be available at <code className="bg-muted px-1 py-0.5 rounded text-xs">{process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/sitemap.xml</code>
              </span>
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="seo_sitemap_enabled"
                defaultChecked={getSwitchDefaultChecked('seo_sitemap_enabled')}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  if (sitemapHiddenRef.current) sitemapHiddenRef.current.value = checked ? 'true' : 'false';
                }}
              />
              <input ref={sitemapHiddenRef} type="hidden" name="seo_sitemap_enabled" defaultValue={getSwitchDefaultChecked('seo_sitemap_enabled') ? 'true' : 'false'} />
            </div>
          </div>
          {state?.errors?.seo_sitemap_enabled && <p className="text-sm font-medium text-destructive">{typeof state.errors.seo_sitemap_enabled === 'string' ? state.errors.seo_sitemap_enabled : state.errors.seo_sitemap_enabled?.[0]}</p>}

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="seo_friendly_urls_enabled" className="flex flex-col space-y-1">
              <span>Enable Friendly URLs</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Use readable URLs with topic and category names instead of IDs. For example: <code className="bg-muted px-1 py-0.5 rounded text-xs">/topics/my-awesome-topic</code> instead of <code className="bg-muted px-1 py-0.5 rounded text-xs">/topics/123</code>
              </span>
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="seo_friendly_urls_enabled"
                defaultChecked={getSwitchDefaultChecked('seo_friendly_urls_enabled')}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  if (friendlyHiddenRef.current) friendlyHiddenRef.current.value = checked ? 'true' : 'false';
                }}
              />
              <input ref={friendlyHiddenRef} type="hidden" name="seo_friendly_urls_enabled" defaultValue={getSwitchDefaultChecked('seo_friendly_urls_enabled') ? 'true' : 'false'} />
            </div>
          </div>
          {state?.errors?.seo_friendly_urls_enabled && <p className="text-sm font-medium text-destructive">{typeof state.errors.seo_friendly_urls_enabled === 'string' ? state.errors.seo_friendly_urls_enabled : state.errors.seo_friendly_urls_enabled?.[0]}</p>}
        </CardContent>
      </Card>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving SEO Settings..." disabled={isPending}>
          Save SEO Settings
        </SubmitButton>
      </div>
    </form>
  );
}
