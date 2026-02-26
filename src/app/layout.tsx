import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EBFC Sprint Burndown",
  description:
    "Track your Scrum sprint with the EBFC burndown tool. Built for construction teams using Lean + Scrum principles. 1 card = 1 point. PPC% included.",
  keywords: ["scrum", "burndown", "construction", "lean", "EBFC", "sprint", "PPC"],
  authors: [{ name: "EBFC Scrum Community", url: "https://www.theebfcshow.com" }],
  openGraph: {
    title: "🔥 EBFC Sprint Burndown",
    description: "Track your sprint. Tell your story.",
    url: "https://ebfc-sprint-burndown.vercel.app",
    siteName: "EBFC Sprint Burndown",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔥</text></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
