"use client";

import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  candidateName: string;
  onCandidateNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export function EditCandidateModal({
  open,
  candidateName,
  onCandidateNameChange,
  onClose,
  onSave,
  isSaving,
}: Props) {
  return (
    <Modal
      open={open}
      title="Edit Kandidat"
      description="Ubah nama kandidat (hanya saat pemilihan closed)."
      onClose={onClose}
      widthClassName="max-w-md"
    >
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-500">
          Nama kandidat
          <input
            value={candidateName}
            onChange={(e) => onCandidateNameChange(e.target.value)}
            placeholder="Nama kandidat"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || candidateName.trim().length === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
