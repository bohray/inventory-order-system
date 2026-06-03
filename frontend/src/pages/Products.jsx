import { useState } from "react";
import toast from "react-hot-toast";
import { LuPlus, LuPencil, LuTrash2 } from "react-icons/lu";
import { api } from "../api/client.js";
import { usePaginatedApi } from "../hooks/usePaginatedApi.js";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { LOW_STOCK_THRESHOLD, MESSAGES } from "../constants/app-data.js";
import { formatCurrency } from "../utils/format.js";
import Table from "../components/UI/Table.jsx";
import Badge from "../components/UI/Badge.jsx";
import Button from "../components/UI/Button.jsx";
import Pagination from "../components/UI/Pagination.jsx";
import ProductFormModal from "../components/Products/ProductFormModal.jsx";

export default function Products() {
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
  } = usePaginatedApi(api.listProducts);
  const { confirm, ConfirmModal } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setModalOpen(true);
  }

  function handleSaved(isCreate) {
    setModalOpen(false);
    if (isCreate) setPage(1);
    reload();
  }

  async function remove(product) {
    const ok = await confirm({
      title: "Delete product",
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.deleteProduct(product.id);
      toast.success(MESSAGES.productDeleted);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const columns = [
    { key: "name", header: "Name", className: "font-medium text-slate-800" },
    { key: "sku", header: "SKU" },
    { key: "price", header: "Price", render: (p) => formatCurrency(p.price) },
    {
      key: "quantity",
      header: "Stock",
      render: (p) => (
        <Badge tone={p.quantity <= LOW_STOCK_THRESHOLD ? "low" : "ok"}>
          {p.quantity}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
            <LuPencil size={15} /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => remove(p)}>
            <LuTrash2 size={15} /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Products</h2>
        <Button onClick={openCreate}>
          <LuPlus size={18} /> Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage={MESSAGES.noProducts}
      />

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {modalOpen && (
        <ProductFormModal
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {ConfirmModal}
    </div>
  );
}
