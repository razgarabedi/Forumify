
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Use Geist Sans
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer'; // Import Footer
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'; // Import MobileBottomNav
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { ThemeProvider } from "@/components/ThemeProvider"; // Correct import path for ThemeProvider
import { getAllSiteSettings } from '@/lib/db';
import { generatePageMetadata } from '@/lib/seo';
import { CustomInjections } from '@/components/layout/CustomInjections';
import { getCurrentUser } from '@/lib/actions/auth';
import { getUnreadNotificationCountAction } from '@/lib/actions/notifications';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteSettings = await getAllSiteSettings();
    return generatePageMetadata(
      {
        title: siteSettings.seo_site_title || 'Rexerium Forum - Light Forum Solution',
        description: siteSettings.seo_site_description || 'Conversations Made Simple. A simple, efficient platform for community building.',
        keywords: siteSettings.seo_site_keywords,
        ogImage: siteSettings.seo_og_image,
        ogType: 'website',
        canonicalUrl: '/',
      },
      siteSettings
    );
  } catch (error) {
    // Fallback metadata if database is unavailable
    return {
      title: 'Rexerium Forum - Light Forum Solution',
      description: 'Conversations Made Simple. A simple, efficient platform for community building.',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user and notification count for mobile nav
  const user = await getCurrentUser();
  let initialUnreadCount = 0;
  if (user) {
    const result = await getUnreadNotificationCountAction();
    if (result.success && typeof result.data === 'number') {
      initialUnreadCount = result.data;
    }
  }

  return (
    // Remove any whitespace between <html> and <body>
    // Set dark as default class to prevent flash
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        {/* Inline blocking script - must be first in body to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    // System preference - check if user prefers light
                    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                    if (prefersLight) {
                      document.documentElement.classList.remove('dark');
                    } else {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {
                  // Keep dark as default if error
                }
              })();
            `,
          }}
        />
         <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Set default theme to dark
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
         >
            <div className="relative flex min-h-screen flex-col bg-background" suppressHydrationWarning>
              {/* Custom header HTML and CSS via site settings */}
              <CustomInjections position="header" />
              {/* Inject custom header HTML and CSS */}
              {/* These are rendered by a dedicated component to keep RootLayout synchronous */}
              <Header />
              <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8"> {/* Added bottom padding for mobile nav */}
                 {children}
              </main>
              <Footer /> {/* Add Footer here */}
              {/* Custom footer HTML via site settings */}
              <CustomInjections position="footer" />
              {/* Mobile Bottom Navigation */}
              <MobileBottomNav user={user} initialUnreadCount={initialUnreadCount} />
            </div>
             <Toaster /> {/* Add Toaster here */}
        </ThemeProvider>
      </body>
    </html>
  );
}

