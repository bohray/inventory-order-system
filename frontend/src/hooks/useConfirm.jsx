import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../components/UI/ConfirmDialog.jsx";

// Imperative confirm dialog.
//   const { confirm, ConfirmModal } = useConfirm();
//   if (await confirm({ title, message, confirmLabel, tone })) { ... }
//   ...render {ConfirmModal} somewhere in the component tree.
export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, ... } | null
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setState(options || {});
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result) => {
    setState(null);
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  }, []);

  const ConfirmModal = state ? (
    <ConfirmDialog
      {...state}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, ConfirmModal };
}
