import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { fontVariables } from "@crivelo/tokens/fonts";
import "./globals.css";
import { Toaster } from "@crivelo/ui/sonner";

// Only emit Vercel Analytics from the production deploy. Vercel sets
// VERCEL_ENV to 'production' | 'preview' | 'development' automatically; gating
// here prevents preview deploys and `npm run dev` from polluting the dataset.
const isProduction = process.env.VERCEL_ENV === "production";

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
      <body className={fontVariables}>
        {children}
        <Toaster position="bottom-center" duration={3000} />
        {isProduction && <Analytics />}
      </body>
    </html>
  );
}
