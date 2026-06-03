import { LuMenu } from "react-icons/lu";

export default function Topbar({ collapsed, onToggle }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3.5 border-b border-slate-200 bg-white px-5 py-3">
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        title={collapsed ? "Open sidebar" : "Close sidebar"}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
      >
        <LuMenu size={18} />
      </button>
      <span className="text-[15px] font-semibold text-slate-700">
        Inventory &amp; Order Management
      </span>
    </header>
  );
}
