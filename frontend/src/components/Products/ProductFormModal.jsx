import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { EMPTY_PRODUCT, MESSAGES } from "../../constants/app-data.js";
import Modal from "../../components/UI/Modal.jsx";
import Field from "../../components/UI/Field.jsx";
import Button from "../../components/UI/Button.jsx";

const FIELDS = [
  { name: "name", label: "Product Name", type: "text" },
  { name: "sku", label: "SKU / Code", type: "text" },
  { name: "price", label: "Price", type: "number" },
  { name: "quantity", label: "Quantity in Stock", type: "number" },
];

function toForm(product) {
  if (!product) return { ...EMPTY_PRODUCT };
  return {
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    quantity: String(product.quantity),
  };
}

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => toForm(product));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price === "" || Number(form.price) < 0)
      e.price = "Price must be 0 or more";
    if (
      form.quantity === "" ||
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.quantity) < 0
    )
      e.quantity = "Quantity must be a whole number, 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    try {
      if (isEdit) {
        await api.updateProduct(product.id, payload);
        toast.success(MESSAGES.productUpdated);
      } else {
        await api.createProduct(payload);
        toast.success(MESSAGES.productCreated);
      }
      onSaved(!isEdit);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              type={f.type}
              value={form[f.name]}
              onChange={(v) => set(f.name, v)}
              error={errors[f.name]}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
