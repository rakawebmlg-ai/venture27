'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

// Public programmatic pages (/{city}/services/{category}/{service}) are
// meant to look like a standalone landing page, not a page inside the admin
// dashboard - so the sidebar/top header are skipped for exactly that URL
// shape and shown for everything else (all the existing dashboard routes).
const PROGRAMMATIC_PAGE_PATTERN = /^\/[^/]+\/services\/[^/]+\/[^/]+\/?$/;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname && PROGRAMMATIC_PAGE_PATTERN.test(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <TopHeader />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
