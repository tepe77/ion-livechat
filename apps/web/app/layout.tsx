import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from "../components/auth/AuthInitializer";

export const metadata: Metadata = {
  title: "ION Live Chat - ISP Customer Service & Technical Support",
  description: "Realtime customer support live chat system for ION ISP customers, agents, managers, and administrators.",
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
