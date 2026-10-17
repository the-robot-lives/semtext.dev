import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const siteUrl = "https://semtext.dev";
const title = "SemText — one HTML file, in place of Markdown";
const description =
  "SemText: one HTML file that models read and write instead of Markdown. Readable as text as-is; opened in a browser, the same markup becomes working web components. Part of The Robot Lives portfolio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "semtext",
  authors: [{ name: "The Robot Lives", url: "https://therobotlives.com" }],
  keywords: [
    "semtext",
    "HTML",
    "Markdown replacement",
    "AI prompts",
    "structured documents",
    "web components",
    "Lit",
    "The Robot Lives",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "semtext",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 675,
        alt: "SemText — one HTML file, in place of Markdown.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="docs-bg min-h-screen antialiased">
        <a className="skip-link" href="#main">
          Skip to docs
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
