import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { DASHBOARD_STATS } from "../constants/dashboard-data.js";
import { MESSAGES } from "../constants/app-data.js";
import Table from "../components/UI/Table.jsx";
import Badge from "../components/UI/Badge.jsx";
import StatCard from "../components/Dashboard/StatCard.jsx";

const lowStockColumns = [
  { key: "name", header: "Name" },
  { key: "sku", header: "SKU" },
  {
    key: "quantity",
    header: "Quantity",
    render: (p) => <Badge tone="low">{p.quantity}</Badge>,
  },
];

export default function Dashboard() {
  const { data, loading } = useApi(api.getDashboard);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h2>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            Icon={stat.Icon}
            tone={stat.tone}
            value={data ? data[stat.key] : 0}
            loading={loading}
          />
        ))}
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          Low Stock Products
        </h3>
        {!loading && data && data.low_stock_products.length === 0 ? (
          <p className="text-slate-500">{MESSAGES.wellStocked}</p>
        ) : (
          <Table
            columns={lowStockColumns}
            data={data ? data.low_stock_products : []}
            loading={loading}
            minWidth="min-w-[420px]"
            className="overflow-x-auto"
            skeletonRows={3}
          />
        )}
      </div>
    </div>
  );
}
