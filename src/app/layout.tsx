import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micromouse Simulator",
  description: "A simulation of the Micromouse maze-solving robot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
