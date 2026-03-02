import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header/Header';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'NekoStream - Premium Anime Watching',
  description: 'Watch your favorite anime in high quality with no ads.',
  referrer: 'no-referrer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="app-container">
            <Header />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
