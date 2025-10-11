import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podcast Therapy Scanner",
  description: "Herramienta interna para detectar menciones de terapia en YouTube",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="bg-gray-50 text-gray-900 font-sans">{children}</body>
    </html>
  );
}
