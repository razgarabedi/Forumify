
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
