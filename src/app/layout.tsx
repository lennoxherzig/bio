import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { profile } from "@/config/profile";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: profile.title,
  description: profile.title,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-black">{children}</body>
    </html>
  );
}
