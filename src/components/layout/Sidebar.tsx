import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  CircleHelp,
  Plus,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ar-management/invoices", label: "AR Management", icon: FileText },
  { to: "/collection", label: "Collection & Aktivitas", icon: ClipboardList },
  { to: "/customers", label: "Customers & Credit Control", icon: Users },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings & Data Management", icon: Settings },
];

const AR_SUBITEMS = [
  { to: "/ar-management/invoices", label: "Invoices" },
  { to: "/ar-management/disputes", label: "Dispute Center" },
];

export default function Sidebar() {
  const openRecordPayment = useUIStore((s) => s.openRecordPayment);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col border-r border-border-subtle bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/logo.png" alt="Accounts Receivable" className="h-9 w-9 shrink-0 object-contain" />
        <div>
          <p className="text-sm font-semibold leading-tight text-brand-950">
            Accounts Receivable
          </p>
          <p className="text-xs text-brand-700">Dashboard Internal Finance</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={() => openRecordPayment()}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-action px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-hover"
        >
          <Plus size={16} />
          Catat Pembayaran
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <div key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-950 text-white"
                    : "text-brand-700 hover:bg-neutral-bg"
                )
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
            {item.to === "/ar-management/invoices" && (
              <div className="ml-[30px] mt-0.5 space-y-0.5 border-l border-border-subtle pl-3">
                {AR_SUBITEMS.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      clsx(
                        "block rounded-[var(--radius-control)] px-2.5 py-1.5 text-[13px] transition-colors",
                        isActive
                          ? "font-medium text-action"
                          : "text-brand-700 hover:bg-neutral-bg"
                      )
                    }
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-border-subtle px-3 py-3">
        {session?.user?.email && (
          <p className="truncate px-3 pb-2 text-xs text-brand-700" title={session.user.email}>
            {session.user.email}
          </p>
        )}
        <button className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-sm text-brand-700 hover:bg-neutral-bg">
          <CircleHelp size={17} />
          Pusat Bantuan
        </button>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-sm text-brand-700 hover:bg-neutral-bg"
        >
          <LogOut size={17} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
