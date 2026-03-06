import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Audit App",
  description: "AI-powered SEO & SEM audit tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
