import { getAllSiteSettings } from "@/lib/db";

interface CustomInjectionsProps {
  position: 'header' | 'footer';
}

export async function CustomInjections({ position }: CustomInjectionsProps) {
  const settings = await getAllSiteSettings();

  if (position === 'header') {
    return (
      <>
        {settings.appearance_custom_css && (
          <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: settings.appearance_custom_css }} />
        )}
        {settings.appearance_custom_header_html && (
          <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: settings.appearance_custom_header_html }} />
        )}
      </>
    );
  }

  if (position === 'footer') {
    return (
      <>
        {settings.appearance_custom_footer_html && (
          <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: settings.appearance_custom_footer_html }} />
        )}
      </>
    );
  }

  return null;
}


