import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const siteUrl = "https://semtext.dev";
const title = "SemText — one XHTML file, in place of Markdown";
const description =
  "SemText is a context-dense XHTML replacement for Markdown in AI prompts. One standalone file, read three ways: a browser renders it with Lit web components, a model reads it as structural XHTML, and it is readable plain text as-is. Part of The Robot Lives portfolio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "semtext",
  authors: [{ name: "The Robot Lives", url: "https://therobotlives.com" }],
  keywords: [
    "semtext",
    "XHTML",
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
        alt: "SemText — one XHTML file, in place of Markdown.",
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
