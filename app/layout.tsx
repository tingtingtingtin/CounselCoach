import type { Metadata } from "next";
import "@fontsource/uncut-sans/400.css";
import "@fontsource/uncut-sans/500.css";
import "@fontsource/uncut-sans/600.css";
import "@fontsource/uncut-sans/700.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = {
  title: "CounselCoach",
  description: "Therapist training simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
      <Footer />
    </>
  );
}
