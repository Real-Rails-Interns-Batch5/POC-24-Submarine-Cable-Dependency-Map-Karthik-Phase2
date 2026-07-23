import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/providers/AppStateProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Submarine Cable Dependency Map",
  description: "Real Rails Intelligence Library: Project #24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppStateProvider>
          {children}
        </AppStateProvider>
      </body>
    </html>
  );
}
