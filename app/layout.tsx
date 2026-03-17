import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';
import './globals.css';

const openSans = Open_Sans({ subsets: ['latin', 'cyrillic'], variable: '--font-open-sans' });

export const metadata: Metadata = {
  title: 'Сбор заказов',
  description: 'Система сбора заказов в магазине',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={openSans.variable}>
      <body className="antialiased min-h-screen bg-gray-50 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
