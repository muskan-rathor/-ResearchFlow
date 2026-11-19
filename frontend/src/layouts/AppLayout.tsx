
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Sparkles,
  GitCompareArrows,
  Network,
  FileBarChart,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

import { useAuthStore } from "../stores/authStore";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Workspaces", path: "/workspaces", icon: FolderOpen },
  { name: "Papers", path: "/papers", icon: FileText },
  { name: "AI Assistant", path: "/assistant", icon: Sparkles },
  { name: "Paper Comparison", path: "/compare", icon: GitCompareArrows },
  { name: "Research Gaps", path: "/research-gaps", icon: Network },
  { name: "Saved Reports", path: "/reports", icon: FileBarChart },
];

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

 function handleLogout() {
  logout();
  navigate("/", { replace: true });
}

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-xl font-bold text-white">
            R
          </div>
          <span className="text-xl font-bold tracking-tight">
            ResearchFlow
          </span>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-violet-50 font-semibold text-violet-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-violet-700"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 font-semibold text-violet-700">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name || "Researcher"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-w-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div>
            <p className="text-sm font-medium text-slate-700">
              ResearchFlow
            </p>
            <p className="text-xs text-slate-400">
              Your intelligent research workspace
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Search size={19} />
            </button>

            <button
              aria-label="Notifications"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={19} />
            </button>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
