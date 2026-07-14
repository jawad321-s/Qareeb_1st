import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qareeb Admin',
  description: 'Enterprise dashboard for the Qareeb home-services platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
