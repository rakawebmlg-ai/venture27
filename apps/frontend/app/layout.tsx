import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";

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

export const metadata = {
  title: "Venture 27 — Dashboard",
  description: "Programmatic Pages Generation & Data Management Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        <div className="dashboard-layout">
          <Sidebar />
          <main className="main-content">
            <TopHeader />
            <div className="page-content">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
