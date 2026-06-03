import { useState } from "react";
import toast from "react-hot-toast";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { api } from "../api/client.js";
import { usePaginatedApi } from "../hooks/usePaginatedApi.js";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { MESSAGES } from "../constants/app-data.js";
import Table from "../components/UI/Table.jsx";
import Button from "../components/UI/Button.jsx";
import Pagination from "../components/UI/Pagination.jsx";
import CustomerFormModal from "../components/Customers/CustomerFormModal.jsx";

export default function Customers() {
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
  } = usePaginatedApi(api.listCustomers);
  const { confirm, ConfirmModal } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);

  function handleSaved() {
    setModalOpen(false);
    setPage(1);
    reload();
  }

  async function remove(customer) {
    const ok = await confirm({
      title: "Delete customer",
      message: `Delete "${customer.full_name}"? This also removes their orders.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.deleteCustomer(customer.id);
      toast.success(MESSAGES.customerDeleted);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const columns = [
    {
      key: "full_name",
      header: "Name",
      className: "font-medium text-slate-800",
    },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex justify-end">
          <Button variant="danger" size="sm" onClick={() => remove(c)}>
            <LuTrash2 size={15} /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <Button onClick={() => setModalOpen(true)}>
          <LuPlus size={18} /> Add Customer
        </Button>
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage={MESSAGES.noCustomers}
        minWidth="min-w-[520px]"
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
        <CustomerFormModal
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {ConfirmModal}
    </div>
  );
}
