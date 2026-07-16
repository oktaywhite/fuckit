import Link from "next/link";
import { ShieldHalf, LayoutDashboard, Users, Swords, LogOut, Calendar } from "lucide-react";
import { logoutAction } from "./actions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/40 bg-card/30 backdrop-blur shrink-0 flex flex-col">
        <div className="p-6 border-b border-border/40 flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ShieldHalf className="w-6 h-6" />
            <h2 className="font-bold tracking-tight">FUCKIT</h2>
          </Link>
          <p className="text-xs text-muted-foreground uppercase tracking-wider ml-8">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/players"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Users className="w-4 h-4" />
            Oyuncular
          </Link>
          <Link
            href="/admin/matches"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Swords className="w-4 h-4" />
            Maçlar
          </Link>
          <Link
            href="/admin/season"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Sezon
          </Link>
        </nav>

        <div className="p-4 border-t border-border/40">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
