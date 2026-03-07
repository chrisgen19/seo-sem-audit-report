import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </Providers>
  );
}
