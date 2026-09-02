import type { Metadata } from "next";
import { Geist_Pixel, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Font weights for Tailwind classes:
 * font-thin: 100
 * font-extralight: 200
 * font-light: 300
 * font-normal: 400
 * font-medium: 500
 * font-semibold: 600
 * font-bold: 700
 * font-extrabold: 800
 * font-black: 900
 */

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

const pixolletta = localFont({
  src: "./fonts/Pixolletta8px.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-pixolleta",
});

export const geistPixel = Geist_Pixel({
  subsets: ["latin"],
  axes: ["ELSH"], // keep the shape axis variable
  variable: "--font-geist-pixel",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "tomd",
  description: "Software Engineer",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        pixolletta.variable,
        geistPixel.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            enableSystem
            defaultTheme="system"
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
