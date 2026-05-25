import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TabsProvider } from "@/components/TabsProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mb8055 // blog",
  description: "notes on embedded systems, security research, and the things i break",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} font-mono antialiased h-full`}>
        <ThemeProvider>
          <TabsProvider>{children}</TabsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
