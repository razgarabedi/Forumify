
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Use Geist Sans
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { ThemeProvider } from "@/components/ThemeProvider"; // Correct import path for ThemeProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ForumLite', // Updated App Name
  description: 'A simple forum application built with Next.js', // Updated description
};

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
            <div className="relative flex min-h-screen flex-col bg-background">
              <Header />
              <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"> {/* Adjusted padding */}
                 {children}
              </main>
               {/* Add a footer here if desired */}
               {/* <footer className="mt-auto border-t py-4 text-center text-sm text-muted-foreground">
                   © {new Date().getFullYear()} ForumLite. All rights reserved.
               </footer> */}
            </div>
             <Toaster /> {/* Add Toaster here */}
        </ThemeProvider>
      </body>
    </html>
  );
}

