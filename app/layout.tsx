import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "RescueCalc FOG/SOG",
  description: "Offline field calculator and citation assistant for uploaded rescue manuals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="safe-banner px-3 py-2 text-center text-xs font-semibold">
          Training aid only. Follow manufacturer instructions and agency SOPs. Stop if uncertain.
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
