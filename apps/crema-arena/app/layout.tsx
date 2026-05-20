import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

// Only emit Vercel Analytics from the production deploy. Vercel sets
// VERCEL_ENV to 'production' | 'preview' | 'development' automatically; gating
// here prevents preview deploys and `npm run dev` from polluting the dataset.
const isProduction = process.env.VERCEL_ENV === "production";

// Crema Arena design system fonts — local files in /public/fonts/
const bricolageGrotesque = localFont({
  src: "../public/fonts/BricolageGrotesque-VariableFont_opsz_wdth_wght.ttf",
  variable: "--font-display",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "../public/fonts/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

const geistSans = localFont({
  src: "../public/fonts/Geist-VariableFont_wght.ttf",
  variable: "--font-body",
  display: "swap",
});

const geistMono = localFont({
  src: "../public/fonts/GeistMono-VariableFont_wght.ttf",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crema Arena",
  description: "Specialty Coffee Competition Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${bricolageGrotesque.variable} ${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>{children}</ToastProvider>
        {isProduction && <Analytics />}
      </body>
    </html>
  );
}
