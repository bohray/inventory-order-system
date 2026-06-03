import { formatCurrency } from "../../utils/format.js";
import Modal from "../../components/UI/Modal.jsx";
import Button from "../../components/UI/Button.jsx";
import Table from "../../components/UI/Table.jsx";

const columns = [
  {
    key: "product",
    header: "Product",
    render: (it) => it.product_name || `Product ${it.product_id}`,
  },
  { key: "quantity", header: "Qty" },
  {
    key: "unit_price",
    header: "Unit Price",
    render: (it) => formatCurrency(it.unit_price),
  },
  {
    key: "subtotal",
    header: "Subtotal",
    render: (it) => formatCurrency(Number(it.unit_price) * it.quantity),
  },
];

export default function OrderDetailModal({ order, onClose }) {
  return (
    <Modal title={`Order #${order.id}`} onClose={onClose}>
      <p className="text-slate-700">
        <span className="font-semibold">Customer:</span>{" "}
        {order.customer_name || `Customer ${order.customer_id}`}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Placed {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="mt-3">
        <Table
          columns={columns}
          data={order.items}
          rowKey={(it) => it.id}
          minWidth="min-w-[420px]"
          className="overflow-x-auto rounded-lg border border-slate-200"
        />
      </div>

      <h3 className="mt-4 text-right text-lg font-bold text-slate-800">
        Total: {formatCurrency(order.total_amount)}
      </h3>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
