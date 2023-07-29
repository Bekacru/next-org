import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextOrgProvider } from "@next-org/react";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Next Org App",
  description:
    "A demo app for next-org to manage teams and organization on app",
};

const satoshi = localFont({
  src: [
    {
      path: "../../assets/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../assets/Satoshi-Black.woff2",
      weight: "900",
      style: "black",
    },
  ],
  variable: "--font-satoshi",
});

const heading = localFont({
  src: "../../assets/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn("font-sans", satoshi.variable, heading.variable)}>
        <NextOrgProvider>
          <ThemeProvider enableSystem attribute="class">
            {children}
          </ThemeProvider>
        </NextOrgProvider>
      </body>
    </html>
  );
}
