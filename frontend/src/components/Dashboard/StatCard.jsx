export default function StatCard({ label, value, Icon, tone, loading }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        {loading ? (
          <div className="mt-2 h-8 w-12 animate-pulse rounded bg-slate-200" />
        ) : (
          <div className="mt-1 text-3xl font-bold text-slate-800">{value}</div>
        )}
      </div>
    </div>
  );
}
