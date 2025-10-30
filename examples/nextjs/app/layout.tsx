import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Start.gg OAuth2 × Next.js Demo',
  description: 'Demonstrates PKCE with startgg-oauth2-full inside a Next.js App Router project.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
