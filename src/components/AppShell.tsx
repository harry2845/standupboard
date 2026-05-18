import Link from "next/link";
import { ReactNode } from "react";
import { PanelsTopLeft } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300">
              <PanelsTopLeft size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Standup
              </span>
              <span className="block text-xl font-bold tracking-tight">Flow Board</span>
            </span>
          </Link>
          <nav className="flex rounded-full border border-slate-200 bg-white/80 p-1 text-sm font-medium shadow-sm">
            <Link className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100" href="/">
              Board
            </Link>
            <Link className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100" href="/people">
              People
            </Link>
            <Link className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100" href="/work-areas">
              Areas
            </Link>
            <Link className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100" href="/activity">
              Activity
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
