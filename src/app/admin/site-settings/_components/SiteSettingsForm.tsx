
"use client";

import { useActionState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSiteSettingsAction } from '@/lib/actions/admin';
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionResponse, SiteSettings, EventWidgetPosition, EventWidgetDetailLevel } from '@/lib/types';
import { SlidersHorizontal } from 'lucide-react';

interface SiteSettingsFormProps {
  initialSettings: SiteSettings;
}

const initialActionState: ActionResponse = {
    message: '',
    errors: {},
    success: false,
    rawData: null,
};

// Helper type for raw form data expected from action state
type RawSiteSettingsData = {
  events_widget_enabled?: string | null;
  events_widget_position?: EventWidgetPosition | null;
  events_widget_detail_level?: EventWidgetDetailLevel | null;
  events_widget_item_count?: string | null;
  events_widget_title?: string | null;
  links_docs_url?: string | null;
  links_community_url?: string | null;
  core_welcome_banner?: string | null;
  core_censor_words?: string | null;
  core_discussion_sorting?: 'latest' | 'newest' | 'top' | null;
  core_allow_signups?: string | null;
};


export function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSiteSettingsAction, initialActionState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const currentRawData = state?.rawData as RawSiteSettingsData | undefined;

  useEffect(() => {
    const hasMeaningfulMessage = state.message && state.message !== '';
    const hasMeaningfulErrors = state.errors && Object.keys(state.errors).length > 0;

    if (state.success && hasMeaningfulMessage) {
      toast({ title: "Success", description: state.message });
      // Form will re-render with new initialSettings due to revalidatePath
    } else if (!state.success && (hasMeaningfulMessage || hasMeaningfulErrors)) {
      let description = state.message || "An error occurred.";
      if (hasMeaningfulErrors && state.errors) {
          const errorMessages = Object.entries(state.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
          description = `Validation failed: ${errorMessages || 'Please check your inputs.'}`;
      }
      toast({ variant: "destructive", title: "Error updating settings", description });
    }
  }, [state, toast]);
  

  const getSwitchDefaultChecked = () => {
    if (state.errors && currentRawData?.events_widget_enabled !== undefined && currentRawData?.events_widget_enabled !== null) {
      return String(currentRawData.events_widget_enabled).toLowerCase() === 'true';
    }
    return initialSettings.events_widget_enabled;
  };

  const getPositionDefaultValue = () => {
    if (state.errors && currentRawData?.events_widget_position) {
      return currentRawData.events_widget_position;
    }
    return initialSettings.events_widget_position;
  };

  const getDetailLevelDefaultValue = () => {
    if (state.errors && currentRawData?.events_widget_detail_level) {
      return currentRawData.events_widget_detail_level;
    }
    return initialSettings.events_widget_detail_level;
  };
  
  const getItemCountDefaultValue = () => {
    if (state.errors && currentRawData?.events_widget_item_count !== undefined && currentRawData?.events_widget_item_count !== null) {
      return String(currentRawData.events_widget_item_count);
    }
    return String(initialSettings.events_widget_item_count);
  };

  const getTitleDefaultValue = () => {
    if (state.errors && currentRawData?.events_widget_title !== undefined && currentRawData?.events_widget_title !== null) {
      return currentRawData.events_widget_title;
    }
    return initialSettings.events_widget_title || "Upcoming Events & Webinars";
  };

  const getDocsUrlDefaultValue = () => {
    if (state.errors && currentRawData?.links_docs_url !== undefined && currentRawData?.links_docs_url !== null) {
      return currentRawData.links_docs_url || '';
    }
    return initialSettings.links_docs_url || '';
  };

  const getCommunityUrlDefaultValue = () => {
    if (state.errors && currentRawData?.links_community_url !== undefined && currentRawData?.links_community_url !== null) {
      return currentRawData.links_community_url || '';
    }
    return initialSettings.links_community_url || '';
  };

  const getWelcomeBannerDefaultValue = () => {
    if (state.errors && currentRawData?.core_welcome_banner !== undefined && currentRawData?.core_welcome_banner !== null) {
      return currentRawData.core_welcome_banner || '';
    }
    return initialSettings.core_welcome_banner || '';
  };

  const getCensorWordsDefaultValue = () => {
    if (state.errors && currentRawData?.core_censor_words !== undefined && currentRawData?.core_censor_words !== null) {
      return currentRawData.core_censor_words || '';
    }
    return initialSettings.core_censor_words || '';
  };

  const getSortingDefaultValue = () => {
    if (state.errors && currentRawData?.core_discussion_sorting) {
      return currentRawData.core_discussion_sorting;
    }
    return initialSettings.core_discussion_sorting || 'latest';
  };

  const getAllowSignupsDefaultChecked = () => {
    if (state.errors && currentRawData?.core_allow_signups !== undefined && currentRawData?.core_allow_signups !== null) {
      return String(currentRawData.core_allow_signups).toLowerCase() === 'true';
    }
    return initialSettings.core_allow_signups ?? true;
  };


  return (
    <Card className="mt-6 mb-8 shadow-md border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
            <SlidersHorizontal className="mr-2 h-5 w-5 text-primary"/>
            Configure Site Features
        </CardTitle>
        <CardDescription>
          Adjust how certain features appear and behave across the site.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-6 pt-0">
          {/* Events Widget Settings */}
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-medium">Events & Webinars Widget</h3>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="events_widget_enabled" className="flex flex-col space-y-1">
                <span>Enable Events Widget</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Show the upcoming events and webinars widget on the homepage.
                </span>
              </Label>
              <Switch
                id="events_widget_enabled"
                name="events_widget_enabled"
                key={`switch-${getSwitchDefaultChecked()}`} 
                defaultChecked={getSwitchDefaultChecked()}
                disabled={isPending}
                value="true" 
              />
            </div>
            {state?.errors?.events_widget_enabled && <p className="text-sm font-medium text-destructive">{typeof state.errors.events_widget_enabled === 'string' ? state.errors.events_widget_enabled : state.errors.events_widget_enabled?.[0]}</p>}

            <div className="space-y-2">
              <Label htmlFor="events_widget_position">Widget Position on Homepage</Label>
              <Select 
                name="events_widget_position" 
                key={`position-${getPositionDefaultValue()}`}
                defaultValue={getPositionDefaultValue()} 
                disabled={isPending}
              >
                <SelectTrigger id="events_widget_position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above_categories">Above Categories</SelectItem>
                  <SelectItem value="below_categories">Below Categories</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.events_widget_position && <p className="text-sm font-medium text-destructive">{typeof state.errors.events_widget_position === 'string' ? state.errors.events_widget_position : state.errors.events_widget_position?.[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="events_widget_detail_level">Widget Detail Level</Label>
              <Select 
                name="events_widget_detail_level" 
                key={`detail-${getDetailLevelDefaultValue()}`}
                defaultValue={getDetailLevelDefaultValue()} 
                disabled={isPending}
              >
                <SelectTrigger id="events_widget_detail_level">
                  <SelectValue placeholder="Select detail level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Details</SelectItem>
                  <SelectItem value="compact">Compact View</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.events_widget_detail_level && <p className="text-sm font-medium text-destructive">{typeof state.errors.events_widget_detail_level === 'string' ? state.errors.events_widget_detail_level : state.errors.events_widget_detail_level?.[0]}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="events_widget_item_count">Number of Events to Display</Label>
                <Input
                    id="events_widget_item_count"
                    name="events_widget_item_count"
                    type="number"
                    min="1"
                    max="10"
                    key={`count-${getItemCountDefaultValue()}`}
                    defaultValue={getItemCountDefaultValue()}
                    disabled={isPending}
                    className="w-24"
                    aria-describedby="item-count-error"
                />
                {state?.errors?.events_widget_item_count && <p id="item-count-error" className="text-sm font-medium text-destructive">{typeof state.errors.events_widget_item_count === 'string' ? state.errors.events_widget_item_count : state.errors.events_widget_item_count?.[0]}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="events_widget_title">Widget Title</Label>
                <Input
                    id="events_widget_title"
                    name="events_widget_title"
                    type="text"
                    maxLength={100}
                    key={`title-${getTitleDefaultValue()}`}
                    defaultValue={getTitleDefaultValue()}
                    disabled={isPending}
                    aria-describedby="title-error"
                />
                {state?.errors?.events_widget_title && <p id="title-error" className="text-sm font-medium text-destructive">{typeof state.errors.events_widget_title === 'string' ? state.errors.events_widget_title : state.errors.events_widget_title?.[0]}</p>}
            </div>
          </div>

          {/* External Links */}
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-medium">Helpful Links</h3>
            <div className="space-y-2">
              <Label htmlFor="links_docs_url">Documentation URL</Label>
              <Input
                id="links_docs_url"
                name="links_docs_url"
                type="url"
                placeholder="https://docs.example.com"
                key={`docs-${getDocsUrlDefaultValue()}`}
                defaultValue={getDocsUrlDefaultValue()}
                disabled={isPending}
                aria-describedby="docs-url-error"
              />
              {state?.errors?.links_docs_url && (
                <p id="docs-url-error" className="text-sm font-medium text-destructive">
                  {typeof state.errors.links_docs_url === 'string' ? state.errors.links_docs_url : state.errors.links_docs_url?.[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="links_community_url">Community URL</Label>
              <Input
                id="links_community_url"
                name="links_community_url"
                type="url"
                placeholder="https://community.example.com"
                key={`community-${getCommunityUrlDefaultValue()}`}
                defaultValue={getCommunityUrlDefaultValue()}
                disabled={isPending}
                aria-describedby="community-url-error"
              />
              {state?.errors?.links_community_url && (
                <p id="community-url-error" className="text-sm font-medium text-destructive">
                  {typeof state.errors.links_community_url === 'string' ? state.errors.links_community_url : state.errors.links_community_url?.[0]}
                </p>
              )}
            </div>
          </div>

          {/* Core Settings */}
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-medium">Basics (Core Settings)</h3>

            {/* Welcome Banner */}
            <div className="space-y-2">
              <Label htmlFor="core_welcome_banner">Welcome Banner</Label>
              <Input
                id="core_welcome_banner"
                name="core_welcome_banner"
                type="text"
                maxLength={500}
                key={`welcome-${getWelcomeBannerDefaultValue()}`}
                defaultValue={getWelcomeBannerDefaultValue()}
                disabled={isPending}
                aria-describedby="welcome-banner-error"
              />
              {state?.errors?.core_welcome_banner && (
                <p id="welcome-banner-error" className="text-sm font-medium text-destructive">
                  {typeof state.errors.core_welcome_banner === 'string' ? state.errors.core_welcome_banner : state.errors.core_welcome_banner?.[0]}
                </p>
              )}
            </div>

            {/* Censor Words */}
            <div className="space-y-2">
              <Label htmlFor="core_censor_words">Censor Words (one per line or comma-separated; use word=****)</Label>
              <textarea
                id="core_censor_words"
                name="core_censor_words"
                rows={6}
                className="w-full border rounded-md p-2 bg-background"
                key={`censor-${getCensorWordsDefaultValue()}`}
                defaultValue={getCensorWordsDefaultValue()}
                disabled={isPending}
                aria-describedby="censor-words-error"
              />
              {state?.errors?.core_censor_words && (
                <p id="censor-words-error" className="text-sm font-medium text-destructive">
                  {typeof state.errors.core_censor_words === 'string' ? state.errors.core_censor_words : state.errors.core_censor_words?.[0]}
                </p>
              )}
            </div>

            {/* Discussion Sorting */}
            <div className="space-y-2">
              <Label htmlFor="core_discussion_sorting">Default Discussion Sorting</Label>
              <Select
                name="core_discussion_sorting"
                key={`sorting-${getSortingDefaultValue()}`}
                defaultValue={getSortingDefaultValue()}
                disabled={isPending}
              >
                <SelectTrigger id="core_discussion_sorting">
                  <SelectValue placeholder="Select default sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Activity</SelectItem>
                  <SelectItem value="newest">Newest Discussions</SelectItem>
                  <SelectItem value="top">Top (Most Posts)</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.core_discussion_sorting && (
                <p className="text-sm font-medium text-destructive">
                  {typeof state.errors.core_discussion_sorting === 'string' ? state.errors.core_discussion_sorting : state.errors.core_discussion_sorting?.[0]}
                </p>
              )}
            </div>

            {/* Allow Signups */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="core_allow_signups" className="flex flex-col space-y-1">
                <span>Allow Signups</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enable user registration for new users.
                </span>
              </Label>
              <Switch
                id="core_allow_signups"
                name="core_allow_signups"
                key={`signups-${getAllowSignupsDefaultChecked()}`}
                defaultChecked={getAllowSignupsDefaultChecked()}
                disabled={isPending}
                value="true"
              />
            </div>
          </div>

          {/* Add other site settings sections here */}
        </CardContent>
        <CardFooter>
          <SubmitButton pendingText="Saving Settings..." disabled={isPending}>
            Save Settings
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
