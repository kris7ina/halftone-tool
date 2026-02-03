import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bitmap Converter',
  description: 'Image → Bitmap converter',
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
