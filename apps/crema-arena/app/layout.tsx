import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
