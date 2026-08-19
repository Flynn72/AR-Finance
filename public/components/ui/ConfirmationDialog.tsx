import Modal from "./Modal";
import Button from "./Button";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "critical";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "critical" ? "critical" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <></>
    </Modal>
  );
}
