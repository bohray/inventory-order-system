import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import {
  EMPTY_CUSTOMER,
  EMAIL_RE,
  MESSAGES,
} from "../../constants/app-data.js";
import Modal from "../../components/UI/Modal.jsx";
import Field from "../../components/UI/Field.jsx";
import Button from "../../components/UI/Button.jsx";

const FIELDS = [
  { name: "full_name", label: "Full Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "text" },
];

export default function CustomerFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_CUSTOMER });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Name is required";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email";
    if (form.phone.trim().length < 3) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast.success(MESSAGES.customerCreated);
      onSaved(true);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Customer" onClose={onClose}>
      <form onSubmit={submit}>
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
