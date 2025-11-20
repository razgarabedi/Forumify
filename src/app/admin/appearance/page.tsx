import { getAllSiteSettings } from "@/lib/db";
import { AlertTriangle, Paintbrush } from "lucide-react";
import { AppearanceForm } from "./_components/AppearanceForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Appearance - Admin Panel',
};

export default async function AdminAppearancePage() {
  let initialSettings;
  let error: string | null = null;

  try {
    initialSettings = await getAllSiteSettings();
  } catch (e: any) {
    error = "Failed to load appearance settings. " + e.message;
    console.error(error);
    initialSettings = {} as any;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Paintbrush className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Appearance</h1>
      </div>
      <p className="text-muted-foreground">Theming and Customization for your forum.</p>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Settings</h3>
          </div>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Defaults will be used where possible.</p>
        </div>
      )}

      <AppearanceForm initialSettings={initialSettings} />
    </div>
  );
}


