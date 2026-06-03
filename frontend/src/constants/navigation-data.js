import {
  LuLayoutDashboard,
  LuPackage,
  LuUsers,
  LuShoppingCart,
} from "react-icons/lu";
import { urls } from "./urls.js";

export const NAV_ITEMS = [
  { to: urls.dashboard, label: "Dashboard", Icon: LuLayoutDashboard },
  { to: urls.products, label: "Products", Icon: LuPackage },
  { to: urls.customers, label: "Customers", Icon: LuUsers },
  { to: urls.orders, label: "Orders", Icon: LuShoppingCart },
];
