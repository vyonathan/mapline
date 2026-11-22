import { useEffect, useState, type ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Navigation from '@/components/navigation/navigation';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mapline — Indonesian Railway Mapping & Exploration',
  description: 'Interactive railway map, station exploration, train simulation, and route planning for Indonesia.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: 'default' as any,
        // Load Clerk from CDN or the server-side Next.js integration.
        // In a real deployment, provide your own publishable key via env vars.
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Navigation />
            <main className="min-h-screen flex flex-col lg:flex-row">
              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
