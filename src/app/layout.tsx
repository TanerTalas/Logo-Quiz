import type { Metadata } from 'next';
import './globals.css';
import { NavigationTracker } from '@/components/NavigationTracker';

export const metadata: Metadata = {
  title: 'Logo Quiz — Guess the brand logos',
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
