import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "StudyStack - Personal Learning Management System",
  description:
    "Track what you studied, when you studied, how much you studied. Manage revisions with spaced repetition, visualize your learning journey through mind maps.",
  keywords: [
    "study",
    "learning",
    "spaced repetition",
    "revision",
    "mind map",
    "study tracker",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <TooltipProvider delay={200}>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          toastOptions={{
            className: "glass",
          }}
        />
      </body>
    </html>
  );
}
