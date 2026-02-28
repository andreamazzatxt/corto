import { AppLock } from "@/components/app-lock";
import { FloatingNav } from "@/components/nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLock>
      <div className="min-h-screen">
        <main className="pb-28">{children}</main>
        <FloatingNav />
      </div>
    </AppLock>
  );
}
