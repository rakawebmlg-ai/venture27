import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Lets relative URLs in generateMetadata (canonical, openGraph.url, ...) on
// the public programmatic pages resolve to a real absolute URL. Set SITE_URL
// in the environment when deploying somewhere other than localhost.
const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Venture 27 — Dashboard",
  description: "Programmatic Pages Generation & Data Management Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
