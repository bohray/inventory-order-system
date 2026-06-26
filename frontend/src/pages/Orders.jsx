import { useState } from "react";
import toast from "react-hot-toast";
import { LuPlus, LuEye, LuBan } from "react-icons/lu";
import { api } from "../api/client.js";
import { usePaginatedApi } from "../hooks/usePaginatedApi.js";
import { useApi } from "../hooks/useApi.js";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { MESSAGES, ORDER_STATUS_TONE } from "../constants/app-data.js";
import { formatCurrency } from "../utils/format.js";
import Table from "../components/UI/Table.jsx";
import Badge from "../components/UI/Badge.jsx";
import Button from "../components/UI/Button.jsx";
import Pagination from "../components/UI/Pagination.jsx";
import CreateOrderModal from "../components/Orders/CreateOrderModal.jsx";
import OrderDetailModal from "../components/Orders/OrderDetailModal.jsx";

export default function Orders() {
  const {
    items,
    total,
    pages,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    reload,
  } = usePaginatedApi(api.listOrders);
  // Dropdowns need every product/customer, not a single page.
  const { data: allProducts, reload: reloadProducts } = useApi(
    api.listAllProducts
  );
  const { data: allCustomers } = useApi(api.listAllCustomers);
  const { confirm, ConfirmModal } = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const canCreate =
    (allCustomers?.length || 0) > 0 && (allProducts?.length || 0) > 0;

  async function viewDetail(id) {
    try {
      setDetail(await api.getOrder(id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    setPage(1);
    reload();
    reloadProducts(); // stock changed
  }

  async function cancel(order) {
    const ok = await confirm({
      title: "Cancel order",
      message: `Cancel order #${order.id}? Stock will be restored.`,
      confirmLabel: "Cancel order",
    });
    if (!ok) return;
    try {
      await api.updateOrderStatus(order.id, "Cancelled");
      toast.success(MESSAGES.orderCancelled);
      reload();
      reloadProducts();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const columns = [
    {
      key: "id",
      header: "Order #",
      render: (o) => `#${o.id}`,
      className: "font-medium text-slate-800",
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => o.customer_name || `Customer ${o.customer_id}`,
    },
    { key: "items", header: "Items", render: (o) => o.items.length },
    {
      key: "total",
      header: "Total",
      render: (o) => formatCurrency(o.total_amount),
      className: "font-medium",
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Badge tone={ORDER_STATUS_TONE[o.status] || "slate"}>{o.status}</Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (o) => new Date(o.created_at).toLocaleDateString(),
      className: "text-slate-500",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => viewDetail(o.id)}>
            <LuEye size={15} /> View
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => cancel(o)}
            disabled={o.status === "Cancelled"}
            title={o.status === "Cancelled" ? "Order already cancelled" : ""}
          >
            <LuBan size={15} /> Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Orders</h2>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          title={
            canCreate ? "" : "Add at least one customer and one product first"
          }
        >
          <LuPlus size={18} /> Create Order
        </Button>
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage={MESSAGES.noOrders}
        minWidth="min-w-[760px]"
      />

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {createOpen && (
        <CreateOrderModal
          customers={allCustomers || []}
          products={allProducts || []}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {detail && (
        <OrderDetailModal order={detail} onClose={() => setDetail(null)} />
      )}

      {ConfirmModal}
    </div>
  );
}
