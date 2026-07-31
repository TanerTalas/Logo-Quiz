import type { Metadata } from 'next';
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
