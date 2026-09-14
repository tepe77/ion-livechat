import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from "../components/auth/AuthInitializer";

export const metadata: Metadata = {
  title: "ION Broadband Livechat - ISP Customer Service & Technical Support",
  description: "Sistem realtime customer support live chat ION Broadband untuk pelanggan, agen, supervisor, dan administrator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}
