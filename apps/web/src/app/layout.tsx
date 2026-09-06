import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import { TanstackQueryProvider } from "@/components/providers/tanstack-query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quinchool",
  description:
    "Quinchool is Quinch's personal all-in-one toolkit, bringing together the essential tools Quinch needs every day.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackQueryProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
