import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
