import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Use Geist Sans
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Remove Geist Mono if only sans-serif is needed
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

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
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="relative flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
             {children}
          </main>
           {/* Add a footer here if desired */}
        </div>
         <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
