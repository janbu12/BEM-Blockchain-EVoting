"use client";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  widthClassName = "max-w-lg",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${widthClassName} rounded-2xl bg-white p-6 shadow-lg`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
