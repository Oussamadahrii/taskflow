import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/access";

export default async function AppLayout({ children }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            TaskFlow
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <form action={logout}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
