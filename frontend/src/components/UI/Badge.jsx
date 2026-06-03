import { cn } from "../../utils/cn.js";

const TONES = {
  ok: "bg-green-100 text-green-700",
  low: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-600",
};

export default function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
