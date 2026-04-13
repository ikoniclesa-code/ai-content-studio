import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Content Studio",
  description: "Kreiranje AI sadržaja za društvene mreže",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #E5E7EB",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
