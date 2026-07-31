import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NavigationTracker } from '@/components/NavigationTracker';

export const metadata: Metadata = {
  // The browser tab reads "Logo Quiz" on every screen. The template applies to any
  // page that sets its own title, so adding one later cannot change what is shown.
  title: {
    default: 'Logo Quiz',
    template: 'Logo Quiz',
  },
  description: 'A blurred brand logo sharpens in seconds. Guess early for maximum points! Designed and coded by Taner Talas.',

  /**
   * Site mark, served from /public.
   *
   * Several formats because browsers disagree: the SVG scales and is what modern
   * browsers prefer, the .ico covers older ones and Windows shortcuts, and the PNGs
   * are what Android and iOS use when the site is saved to a home screen.
   */
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  // Name shown under the icon when the site is added to an iOS home screen.
  appleWebApp: { title: 'Logo Quiz' },
};

export const viewport: Viewport = {
  // Tints the browser chrome on mobile — the accent red the whole design is built on.
  themeColor: '#ec3013',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Tracks route changes so reload-only screens and the intro can tell a document
            load apart from an in-app navigation. Renders nothing. */}
        <NavigationTracker />
        {children}
      </body>
    </html>
  );
}
