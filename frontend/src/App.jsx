import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Layout/Sidebar.jsx";
import Topbar from "./components/Layout/Topbar.jsx";
import { urls } from "./constants/urls.js";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Customers = lazy(() => import("./pages/Customers"));
const Orders = lazy(() => import("./pages/Orders"));

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    </div>
  );
}

export default function App() {
  // Collapsed by default on small screens, open on desktop.
  const [collapsed, setCollapsed] = useState(isMobile());

  // Keep behaviour sensible when the viewport crosses the breakpoint.
  useEffect(() => {
    function onResize() {
      setCollapsed((prev) => (isMobile() ? prev : false));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleNavigate() {
    if (isMobile()) setCollapsed(true);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="top-right" />

      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
        onNavigate={handleNavigate}
      />

      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-slate-900/50 md:hidden"
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        <div className="p-5 md:p-8">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route
                path={urls.root}
                element={<Navigate to={urls.dashboard} replace />}
              />
              <Route path={urls.dashboard} element={<Dashboard />} />
              <Route path={urls.products} element={<Products />} />
              <Route path={urls.customers} element={<Customers />} />
              <Route path={urls.orders} element={<Orders />} />
              <Route
                path="*"
                element={<Navigate to={urls.dashboard} replace />}
              />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
