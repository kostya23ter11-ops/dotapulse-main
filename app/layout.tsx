import type { ReactNode } from "react";
import { Montserrat, Russo_One } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ClientProviders from "./ClientProviders";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

const russoOne = Russo_One({
  variable: "--font-russo-one",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});

export const metadata = {
  title: "DotaPulse - Аналитика твоих матчей",
  description: "Улучшай свой скилл вместе с DotaPulse",
  icons: {
    icon: "/titan.png",
  },
  openGraph: {
    title: "DotaPulse - Аналитика твоих матчей",
    description: "Актуальные сборки, аналитика мета-игры и лучшие гайды от профессионалов Dota 2.",
    url: "https://dotapulse.ru",
    siteName: "DotaPulse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DotaPulse",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DotaPulse - Аналитика твоих матчей",
    description: "Актуальные сборки, аналитика мета-игры и лучшие гайды от профессионалов Dota 2.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://dotapulse.ru"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${montserrat.variable} ${russoOne.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/boxicons.min.css" rel="stylesheet" />
        <link rel="preload" href="/fonts/boxicons/boxicons.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={montserrat.className}>
        <ClientProviders>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ClientProviders>
      </body>
    </html>
  );
}
