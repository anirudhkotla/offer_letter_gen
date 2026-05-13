import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tericsoft HR Portal",
  description: "Offer Letter Automation System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
