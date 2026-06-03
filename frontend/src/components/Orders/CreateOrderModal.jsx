import { useState } from "react";
import toast from "react-hot-toast";
import { LuPlus, LuX } from "react-icons/lu";
import { api } from "../../api/client.js";
import { DEFAULT_ORDER_LINE, MESSAGES } from "../../constants/app-data.js";
import { formatCurrency } from "../../utils/format.js";
import Modal from "../../components/UI/Modal.jsx";
import Button from "../../components/UI/Button.jsx";

export default function CreateOrderModal({
  customers,
  products,
  onClose,
  onCreated,
}) {
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ ...DEFAULT_ORDER_LINE }]);
  const [saving, setSaving] = useState(false);

  const productById = Object.fromEntries(
    products.map((p) => [String(p.id), p])
  );

  const total = lines.reduce((sum, l) => {
    const p = productById[l.product_id];
    const qty = Number(l.quantity) || 0;
    return sum + (p ? Number(p.price) * qty : 0);
  }, 0);

  function updateLine(i, patch) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines([...lines, { ...DEFAULT_ORDER_LINE }]);
  }
  function removeLine(i) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  async function submit(ev) {
    ev.preventDefault();

    if (!customerId) return toast.error("Please select a customer");

    const cleaned = lines
      .filter((l) => l.product_id)
      .map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
      }));

    if (cleaned.length === 0)
      return toast.error("Add at least one product line");
    if (cleaned.some((l) => !Number.isInteger(l.quantity) || l.quantity <= 0))
      return toast.error("Quantities must be whole numbers greater than 0");

    const ids = cleaned.map((l) => l.product_id);
    if (new Set(ids).size !== ids.length)
      return toast.error(
        "Each product can only appear once; merge duplicate lines"
      );

    for (const l of cleaned) {
      const p = productById[String(l.product_id)];
      if (p && l.quantity > p.quantity)
        return toast.error(
          `Insufficient stock for "${p.name}" (available ${p.quantity})`
        );
    }

    setSaving(true);
    try {
      await api.createOrder({
        customer_id: Number(customerId),
        items: cleaned,
      });
      toast.success(MESSAGES.orderCreated);
      onCreated();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Order" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mb-4">
          <label className="label">Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input"
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <label className="label">Products</label>
        {lines.map((line, i) => (
          <div
            key={i}
            className="mb-3 grid grid-cols-1 items-end gap-2.5 sm:grid-cols-[1fr_110px_auto]"
          >
            <select
              value={line.product_id}
              onChange={(e) => updateLine(i, { product_id: e.target.value })}
              className="input"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)} (stock {p.quantity})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: e.target.value })}
              className="input"
            />
            <Button
              variant="danger"
              size="sm"
              className="h-[42px]"
              onClick={() => removeLine(i)}
              disabled={lines.length === 1}
              aria-label="Remove line"
            >
              <LuX size={16} />
            </Button>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="mt-1" onClick={addLine}>
          <LuPlus size={15} /> Add product line
        </Button>

        <h3 className="mt-5 text-right text-lg font-bold text-slate-800">
          Total: {formatCurrency(total)}
        </h3>

        <div className="mt-4 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Placing…" : "Place Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
