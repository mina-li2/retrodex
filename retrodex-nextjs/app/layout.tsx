import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RetroDex — A Fan-Made Pokédex",
  description: "An unofficial, non-commercial fan project inspired by the Pokédex. Not affiliated with Nintendo, Game Freak, or The Pokémon Company.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
