import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elazığ OSB Asistan",
  description: "AI Destekli OSB Asistanı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
