
import { getAllSiteSettings } from "@/lib/db";
import { SiteSettingsForm } from "./_components/SiteSettingsForm";
import { Cog, AlertTriangle } from "lucide-react";

export const metadata = {
  title: 'Site Settings - Admin Panel',
};

export default async function AdminSiteSettingsPage() {
  let initialSettings;
  let error: string | null = null;

  try {
    initialSettings = await getAllSiteSettings();
  } catch (e: any) {
    error = "Failed to load site settings. " + e.message;
    console.error(error);
    // Initialize with defaults if fetching fails, so the form can still render
    initialSettings = {
        events_widget_enabled: true,
        events_widget_position: 'above_categories',
        events_widget_detail_level: 'full',
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Cog className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Site Settings</h1>
      </div>
      <p className="text-muted-foreground">Manage global settings for the forum.</p>

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

      <SiteSettingsForm initialSettings={initialSettings} />
    </div>
  );
}
