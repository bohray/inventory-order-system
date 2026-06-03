import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger", // "danger" | "primary"
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
