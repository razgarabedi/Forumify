
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Use Geist Sans
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer'; // Import Footer
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { ThemeProvider } from "@/components/ThemeProvider"; // Correct import path for ThemeProvider
import { getAllSiteSettings } from '@/lib/db';
import { generatePageMetadata } from '@/lib/seo';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteSettings = await getAllSiteSettings();
    return generatePageMetadata(
      {
        title: siteSettings.seo_site_title || 'ForumLite',
        description: siteSettings.seo_site_description || 'A simple forum application built with Next.js',
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
      title: 'ForumLite',
      description: 'A simple forum application built with Next.js',
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Remove any whitespace between <html> and <body>
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Set default theme to dark
            enableSystem
            disableTransitionOnChange
         >
            <div className="relative flex min-h-screen flex-col bg-background" suppressHydrationWarning>
              <Header />
              <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"> {/* Adjusted padding */}
                 {children}
              </main>
              <Footer /> {/* Add Footer here */}
            </div>
             <Toaster /> {/* Add Toaster here */}
        </ThemeProvider>
      </body>
    </html>
  );
}

