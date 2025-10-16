"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateAppearanceSettingsAction } from "@/lib/actions/admin";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/SubmitButton";
import Image from "next/image";

interface AppearanceFormProps {
  initialSettings: SiteSettings;
}

type RawAppearanceData = {
  appearance_logo_url?: string | null;
  appearance_favicon_url?: string | null;
  appearance_custom_header_html?: string | null;
  appearance_custom_footer_html?: string | null;
  appearance_custom_css?: string | null;
};

const initialActionState = { success: false, message: "", errors: {}, rawData: {} } as any;

export function AppearanceForm({ initialSettings }: AppearanceFormProps) {
  const [state, formAction, isPending] = useActionState(updateAppearanceSettingsAction, initialActionState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const currentRawData = state?.rawData as RawAppearanceData | undefined;

  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.appearance_logo_url || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(initialSettings.appearance_favicon_url || null);

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
      toast({ variant: "destructive", title: "Error updating appearance settings", description });
    }
  }, [state, toast]);

  const getDefaultValue = (key: keyof RawAppearanceData) => {
    if (state.errors && currentRawData?.[key] !== undefined && currentRawData?.[key] !== null) {
      return currentRawData[key] ?? '';
    }
    return (initialSettings as any)[key] || '';
  };

  const handleFileToDataUrl = (file: File, setter: (v: string) => void) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload an image smaller than 2MB." });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please upload an image file (jpeg, png, gif, webp, ico)." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} ref={formRef} className="space-y-6">
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Logo Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logoPreview && (
            <div className="flex items-center gap-3">
              <Image src={logoPreview} alt="Logo preview" width={64} height={64} className="rounded" />
              <Button type="button" variant="outline" onClick={() => setLogoPreview('')}>Remove</Button>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="appearance_logo_file">Upload Logo</Label>
            <Input id="appearance_logo_file" type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileToDataUrl(file, (v) => setLogoPreview(v));
            }} />
            <input type="hidden" name="appearance_logo_url" value={logoPreview || ''} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Favicon Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faviconPreview && (
            <div className="flex items-center gap-3">
              <Image src={faviconPreview} alt="Favicon preview" width={32} height={32} className="rounded" />
              <Button type="button" variant="outline" onClick={() => setFaviconPreview('')}>Remove</Button>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="appearance_favicon_file">Upload Favicon</Label>
            <Input id="appearance_favicon_file" type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileToDataUrl(file, (v) => setFaviconPreview(v));
            }} />
            <input type="hidden" name="appearance_favicon_url" value={faviconPreview || ''} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Custom Header/Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="appearance_custom_header_html">Header HTML/JS</Label>
            <Textarea id="appearance_custom_header_html" name="appearance_custom_header_html" rows={5} defaultValue={getDefaultValue('appearance_custom_header_html') as string} placeholder="<!-- e.g. Google Analytics script -->" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="appearance_custom_footer_html">Footer HTML/JS</Label>
            <Textarea id="appearance_custom_footer_html" name="appearance_custom_footer_html" rows={5} defaultValue={getDefaultValue('appearance_custom_footer_html') as string} placeholder="<!-- e.g. chat widget -->" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="appearance_custom_css">CSS Overrides</Label>
          <Textarea id="appearance_custom_css" name="appearance_custom_css" rows={8} defaultValue={getDefaultValue('appearance_custom_css') as string} placeholder=":root { --primary: #000; }" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton>Save Appearance</SubmitButton>
      </div>
    </form>
  );
}


