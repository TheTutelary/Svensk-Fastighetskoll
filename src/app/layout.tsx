import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Svensk Fastighetskoll | Premium Property Analyzer',
  description: 'AI-powered analysis for Swedish real estate. Get a 100-point rating for any property.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-gray-50/50`}>
        <Header />
        <main className="flex-1 container py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
