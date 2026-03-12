import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <Providers session={session}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </Providers>
  );
}
