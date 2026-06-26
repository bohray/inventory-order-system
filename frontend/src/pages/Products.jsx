import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuSearch,
  LuArrowUp,
  LuArrowDown,
  LuChevronsUpDown,
} from "react-icons/lu";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { useConfirm } from "../hooks/useConfirm.jsx";
import {
  LOW_STOCK_THRESHOLD,
  MESSAGES,
  DEFAULT_PAGE_SIZE,
} from "../constants/app-data.js";
import { formatCurrency } from "../utils/format.js";
import Table from "../components/UI/Table.jsx";
import Badge from "../components/UI/Badge.jsx";
import Button from "../components/UI/Button.jsx";
import Pagination from "../components/UI/Pagination.jsx";
import ProductFormModal from "../components/Products/ProductFormModal.jsx";

// Categories are derived from the SKU prefix (the part before the first hyphen).
const skuCategory = (sku) => (sku.split("-")[0] || "").toUpperCase();

export default function Products() {
  // Load the full catalogue once; search / category / sort / pagination are all
  // applied on the client so filtering is live and works across every page.
  const { data, loading, reload } = useApi(api.listAllProducts);
  const products = useMemo(() => data || [], [data]);
  const { confirm, ConfirmModal } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortKey, setSortKey] = useState(null); // "name" | "price" | "quantity"
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = skuCategory(p.sku);
      if (c) set.add(c);
    }
    return [...set].sort();
  }, [products]);

  // Filter first...
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesText =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);
      const matchesCategory = !category || skuCategory(p.sku) === category;
      return matchesText && matchesCategory;
    });
  }, [products, search, category]);

  // ...then sort...
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "name")
        return (
          dir * a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
      return dir * (Number(a[sortKey]) - Number(b[sortKey]));
    });
  }, [filtered, sortKey, sortDir]);

  // ...then paginate.
  const total = sorted.length;
  const pages = Math.ceil(total / pageSize) || 0;
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  // A changing search term or category invalidates the current page index.
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  // Keep the page in range if the filtered set shrank below it.
  useEffect(() => {
    if (pages > 0 && page > pages) setPage(pages);
  }, [page, pages]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function changePageSize(size) {
    setPageSize(size);
    setPage(1);
  }

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

  const SortHeader = ({ label, columnKey }) => {
    const active = sortKey === columnKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(columnKey)}
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700 cursor-pointer"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <LuArrowUp size={13} />
          ) : (
            <LuArrowDown size={13} />
          )
        ) : (
          <LuChevronsUpDown size={13} className="text-slate-300" />
        )}
      </button>
    );
  };

  const columns = [
    {
      key: "name",
      header: <SortHeader label="Name" columnKey="name" />,
      className: "font-medium text-slate-800",
    },
    { key: "sku", header: "SKU" },
    {
      key: "price",
      header: <SortHeader label="Price" columnKey="price" />,
      render: (p) => formatCurrency(p.price),
    },
    {
      key: "quantity",
      header: <SortHeader label="Stock" columnKey="quantity" />,
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

  const emptyMessage =
    products.length === 0
      ? MESSAGES.noProducts
      : "No products match your filters.";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Products</h2>
        <Button onClick={openCreate}>
          <LuPlus size={18} /> Add Product
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <LuSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="input pl-9"
            aria-label="Search products"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input sm:w-52 cursor-pointer"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={pageItems}
        loading={loading}
        emptyMessage={emptyMessage}
      />

      <Pagination
        page={page}
        pages={pages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={changePageSize}
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
