import type { Metadata, Viewport } from 'next';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAFASITI BA SHARAF — Menu',
  description: 'Neighborhood kitchen — bilingual menu',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#fafaf9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-lang="fa" suppressHydrationWarning>
      {/* The body class is set per-route by client components (BodyClass) below. */}
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
