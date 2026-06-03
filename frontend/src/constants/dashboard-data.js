import {
  LuPackage,
  LuUsers,
  LuShoppingCart,
  LuTriangleAlert,
} from "react-icons/lu";

export const DASHBOARD_STATS = [
  {
    key: "total_products",
    label: "Total Products",
    Icon: LuPackage,
    tone: "bg-brand-50 text-brand-600",
  },
  {
    key: "total_customers",
    label: "Total Customers",
    Icon: LuUsers,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    key: "total_orders",
    label: "Total Orders",
    Icon: LuShoppingCart,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    key: "low_stock_count",
    label: "Low Stock Products",
    Icon: LuTriangleAlert,
    tone: "bg-amber-50 text-amber-600",
  },
];
