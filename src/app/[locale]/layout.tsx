
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for Geist Sans
import '../globals.css'; // Use relative path for globals.css
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n'; // Import locales from i18n config

// Set NEXT_PUBLIC_BASE_URL in your .env.local or environment variables for production
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'; 

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  if (!locales.includes(locale as any)) {
    console.warn(`[LocaleLayout] Invalid locale "${locale}" in generateMetadata. Using default.`);
    // Optionally, you could call notFound() here if you don't want to render for invalid locales
  }
  let t;
  try {
    t = await getTranslations({ locale, namespace: 'Metadata' });
  } catch (error) {
    console.error(`[LocaleLayout] Error fetching translations for metadata, locale: ${locale}`, error);
    // Fallback static metadata if translations fail
    return {
      metadataBase: new URL(baseUrl),
      title: 'ForumLite - Community Discussions',
      description: 'Join the conversation at ForumLite, a modern platform for discussions.',
      openGraph: {
        title: 'ForumLite',
        description: 'A simple forum application built with Next.js',
        url: baseUrl,
        siteName: 'ForumLite',
        images: [
          {
            url: `${baseUrl}/og-default.png`, // Replace with your actual default OG image URL
            width: 1200,
            height: 630,
            alt: 'ForumLite Community',
          },
        ],
        locale: locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'ForumLite',
        description: 'A simple forum application built with Next.js',
        // images: [`${baseUrl}/twitter-default.png`], // Replace with your actual default Twitter image URL
      },
    };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('defaultTitle'),
      template: `%s - ${t('siteName')}`,
    },
    description: t('defaultDescription'),
    openGraph: {
      title: {
        default: t('defaultTitle'),
        template: `%s - ${t('siteName')}`,
      },
      description: t('defaultDescription'),
      url: baseUrl,
      siteName: t('siteName'),
      images: [
        {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: t('defaultTitle'),
        template: `%s - ${t('siteName')}`,
      },
      description: t('defaultDescription'),
      // images: [`${baseUrl}/twitter-default.png`], // Path to your default Twitter image
    },
    // alternates: {
    //   canonical: '/', // Base canonical, will be overridden by specific pages
    //   languages: {
    //     'en': `${baseUrl}/en`,
    //     'de': `${baseUrl}/de`,
    //   },
    // },
  };
}

export const viewport: Viewport = {
  themeColor: [ // Example theme colors
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    console.warn(`[LocaleLayout] Main layout received invalid locale: "${locale}". Calling notFound().`);
    notFound();
  }

  let messages;
  try {
    messages = await getMessages();
    if (!messages || Object.keys(messages).length === 0) {
        console.error(`[LocaleLayout] No messages found for locale: ${locale}. This might indicate an issue with message file loading or an empty message file.`);
        // Depending on desired behavior, you could call notFound() or use fallback messages.
        // For now, we'll let it proceed, but NextIntlClientProvider might complain.
    }
  } catch (error) {
    console.error(`[LocaleLayout] CRITICAL ERROR loading messages for locale "${locale}":`, error);
    // This is a critical failure. It means `src/i18n.ts` or the message import failed.
    // The page will likely crash or show `next-intl` errors.
    // Calling notFound() ensures a graceful 404 instead of a full crash.
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased`}> {/* Use .className for GeistSans */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col bg-background">
              <Header />
              <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
