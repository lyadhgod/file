import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getDictionary } from "../dictionary";
import StyledJsxRegistry from "./registry";
import { UiProvider } from "../git-submodules/components/my-ui/lib/ui-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary('en');
  
  return {
    title: dict['0'],
    description: dict['1']
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StyledJsxRegistry>
          <UiProvider>
            {children}
          </UiProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
