import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const siteUrl = "https://semtext.dev";
const title = "semtext — semantic text processing for developers";
const description =
  "Parse, embed, and query meaning-aware text. Developer docs for a semantic text toolkit: tokens, vectors, and neighbors. Part of The Robot Lives portfolio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "semtext",
  authors: [{ name: "The Robot Lives", url: "https://therobotlives.com" }],
  keywords: [
    "semtext",
    "semantic text",
    "embeddings",
    "tokenization",
    "NLP",
    "similarity search",
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
        alt: "A small black-and-silver robot on a dark desk holds glowing API nodes while tablets around it show docs, code, a schema graph, and telemetry.",
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
