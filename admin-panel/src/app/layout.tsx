import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/client-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'Vervix Admin Panel',
    template: '%s | Vervix Admin',
  },
  description: 'Comprehensive admin panel for Vervix e-commerce platform with powerful management tools for products, orders, customers, and analytics.',
  keywords: [
    'admin panel',
    'e-commerce',
    'dashboard',
    'management',
    'Vervix',
    'online store',
    'inventory',
    'orders',
    'customers',
    'analytics',
  ],
  authors: [{ name: 'Vervix Team' }],
  creator: 'Vervix',
  publisher: 'Vervix',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    notranslate: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  colorScheme: 'light dark',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Vervix Admin Panel',
    description: 'Comprehensive admin panel for Vervix e-commerce platform',
    siteName: 'Vervix Admin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vervix Admin Panel',
    description: 'Comprehensive admin panel for Vervix e-commerce platform',
  },
};

// Root Layout Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ClientProviders>
          {children}
        </ClientProviders>
        
        {/* Prevent flash of unstyled content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </body>
    </html>
  );
}