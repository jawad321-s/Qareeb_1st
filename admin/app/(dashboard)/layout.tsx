import { Sidebar } from '@/components/layout/sidebar';
import { MobileBar } from '@/components/layout/topbar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { CatalogSync } from '@/components/layout/catalog-sync';
import { TabAlert } from '@/components/layout/tab-alert';
import { WarmUp } from '@/components/layout/warm-up';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <CatalogSync />
      <TabAlert />
      <WarmUp />
      {/* The sidebar stays where it is; only the page scrolls. */}
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
