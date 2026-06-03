import { NavLink } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";
import { NAV_ITEMS } from "../../constants/navigation-data.js";
import { cn } from "../../utils/cn.js";

export default function Sidebar({ collapsed, onCollapse, onNavigate }) {
  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden bg-slate-900 text-slate-300",
        "transition-all duration-200 ease-in-out",
        // Mobile: fixed overlay that slides in/out.
        "fixed inset-y-0 left-0 z-60 w-62.5",
        // Desktop: part of the flex flow, width animates.
        "md:static md:z-auto",
        collapsed
          ? "-translate-x-full md:translate-x-0 md:w-0"
          : "translate-x-0 md:w-62.5"
      )}
    >
      <div className="w-62.5 p-5">
        <div className="mb-7 flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold leading-tight text-white">
            Inventory <span className="text-brand-500">&amp;</span> Orders
          </h1>
          <button
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition-colors hover:bg-white/20 cursor-pointer"
          >
            <LuChevronLeft size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-[15px] transition-colors",
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={18} className="shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
