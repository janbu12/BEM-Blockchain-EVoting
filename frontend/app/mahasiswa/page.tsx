"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection, useReadContract } from "wagmi";
import { Candidates } from "@/components/Candidates";
import { Connection } from "@/components/connection";
import { WalletOptions } from "@/components/wallet-option";
import { VOTING_ABI, VOTING_ADDRESS } from "@/lib/contract";
import {
  clearStudentAuth,
  loadStudentAuth,
  saveStudentAuth,
} from "@/components/auth/student-auth";

export default function MahasiswaPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(() => loadStudentAuth());
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeMsg, setChangeMsg] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const { isConnected } = useConnection();
  const studentMode =
    (process.env.NEXT_PUBLIC_STUDENT_MODE ?? "wallet").toLowerCase();
  const useWalletMode = studentMode !== "relayer";
  const requireVerification =
    (process.env.NEXT_PUBLIC_REQUIRE_STUDENT_VERIFICATION ?? "false").toLowerCase() ===
    "true";
  const [activeElectionId, setActiveElectionId] = useState<bigint | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null
  >(null);
  const [verificationReason, setVerificationReason] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [voteHistory, setVoteHistory] = useState<
    {
      electionId: string;
      candidateId: string;
      txHash: string;
      mode: string;
      createdAt: string;
    }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/student/me")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then((result) => {
        if (ignore) return;
        if (result.ok) {
          const nextAuth = {
            nim: result.data.nim,
            mustChangePassword: !!result.data.mustChangePassword,
          };
          saveStudentAuth(nextAuth);
          setAuth(nextAuth);
          if (requireVerification) {
            setVerificationStatus(result.data.verificationStatus);
          }
        } else {
          setAuth(null);
        }
      })
      .catch(() => {
        if (!ignore) setAuth(null);
      });
    return () => {
      ignore = true;
    };
  }, [requireVerification]);

  useEffect(() => {
    if (!requireVerification) return;
    let ignore = false;
    fetch("/api/student/verification/status")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then((result) => {
        if (ignore) return;
        if (result.ok) {
          setVerificationStatus(result.data.verificationStatus);
          setVerificationReason(result.data.verificationRejectReason ?? null);
        } else {
          setVerificationStatus("NONE");
        }
      })
      .catch(() => {
        if (!ignore) setVerificationStatus("NONE");
      });
    return () => {
      ignore = true;
    };
  }, [requireVerification]);

  useEffect(() => {
    let ignore = false;
    setHistoryLoading(true);
    fetch("/api/student/vote-history")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then((result) => {
        if (ignore) return;
        if (result.ok) {
          setVoteHistory(result.data.items ?? []);
        } else {
          setVoteHistory([]);
        }
      })
      .catch(() => {
        if (!ignore) setVoteHistory([]);
      })
      .finally(() => {
        if (!ignore) setHistoryLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!cardFile) {
      setCardPreview(null);
      return;
    }
    const url = URL.createObjectURL(cardFile);
    setCardPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cardFile]);

  useEffect(() => {
    if (!selfieFile) {
      setSelfiePreview(null);
      return;
    }
    const url = URL.createObjectURL(selfieFile);
    setSelfiePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selfieFile]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Mahasiswa
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Voting BEM
            </h1>
          </div>
          <Link
            href="/login"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem("forceDisconnect", "1");
              }
            }}
            className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Kembali ke Login
          </Link>
        </div>

        <div className="mt-6">
          {useWalletMode ? (
            isConnected ? (
              <Connection />
            ) : (
              <WalletOptions />
            )
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Mode relayer aktif. Mahasiswa tidak perlu connect wallet.
            </div>
          )}
        </div>

        {!auth ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Kamu belum login. Silakan kembali ke halaman login mahasiswa.
            <div className="mt-3">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.setItem("forceDisconnect", "1");
                  }
                  router.push("/login");
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Ke Login
              </button>
            </div>
          </div>
        ) : requireVerification && verificationStatus !== "VERIFIED" ? (
          <VerificationCard
            status={verificationStatus}
            reason={verificationReason}
            uploading={uploading}
            uploadMsg={uploadMsg}
            onUpload={async () => {
              if (!cardFile || !selfieFile) {
                setUploadMsg("Lengkapi foto kartu dan selfie.");
                return;
              }
              setUploading(true);
              setUploadMsg(null);
              try {
                const form = new FormData();
                form.append("card", cardFile);
                form.append("selfie", selfieFile);
                const res = await fetch("/api/student/verification/upload", {
                  method: "POST",
                  body: form,
                });
                const data = await res.json();
                if (!res.ok) {
                  setUploadMsg(data?.reason ?? "Gagal upload verifikasi");
                  return;
                }
                setUploadMsg("Berhasil dikirim. Menunggu verifikasi admin.");
                setVerificationStatus("PENDING");
              } catch {
                setUploadMsg("Gagal menghubungi backend");
              } finally {
                setUploading(false);
              }
            }}
            onCardFileChange={setCardFile}
            onSelfieFileChange={setSelfieFile}
            cardPreview={cardPreview}
            selfiePreview={selfiePreview}
          />
        ) : auth.mustChangePassword ? (
          <ChangePasswordCard
            nim={auth.nim}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            message={changeMsg}
            loading={changing}
            onLogout={() => {
              fetch("/api/student/logout", { method: "POST" }).catch(() => {});
              clearStudentAuth();
              setAuth(null);
              router.push("/login");
            }}
            onSubmit={async () => {
              setChangeMsg(null);
              if (newPassword.length < 8) {
                setChangeMsg("Password minimal 8 karakter.");
                return;
              }
              if (newPassword !== confirmPassword) {
                setChangeMsg("Konfirmasi password tidak cocok.");
                return;
              }
              setChanging(true);
              try {
                const res = await fetch("/api/student/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ newPassword }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setChangeMsg(data?.reason ?? "Gagal mengubah password");
                  return;
                }
                const nextAuth = {
                  ...auth,
                  mustChangePassword: false,
                };
                saveStudentAuth(nextAuth);
                setAuth(nextAuth);
                setNewPassword("");
                setConfirmPassword("");
              } catch {
                setChangeMsg(
                  "Backend tidak bisa diakses. Pastikan backend jalan di :4000"
                );
              } finally {
                setChanging(false);
              }
            }}
          />
        ) : useWalletMode && !isConnected ? (
          <p className="mt-4 text-sm text-slate-500">
            Hubungkan wallet untuk mulai voting.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <VerificationStepper status={verificationStatus} />
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              ✅ Login sebagai <span className="font-semibold">{auth.nim}</span>
            </div>
            <VoteHistoryPanel items={voteHistory} loading={historyLoading} />
            {activeElectionId ? (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveElectionId(null)}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                >
                  ← Kembali ke daftar event
                </button>
                <Candidates electionId={activeElectionId} showSelector={false} />
              </div>
            ) : (
              <OpenElections onSelect={setActiveElectionId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationStepper({
  status,
}: {
  status: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
}) {
  const steps = [
    { key: "UPLOAD", label: "Upload" },
    { key: "PENDING", label: "Pending" },
    { key: "VERIFIED", label: "Verified" },
  ];

  const isPending = status === "PENDING";
  const activeIndex =
    status === "VERIFIED"
      ? 2
      : status === "PENDING"
      ? 1
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Status Verifikasi
      </p>
      <div className="mt-4 flex items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                  isActive
                    ? isPending && isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {index + 1}
              </div>
              <div className="text-xs font-semibold text-slate-600">
                {step.label}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-10 rounded-full ${
                    index < activeIndex
                      ? isPending
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {status === "REJECTED" && (
        <p className="mt-3 text-xs text-rose-600">
          Verifikasi ditolak. Upload ulang dengan data yang jelas.
        </p>
      )}
    </div>
  );
}

function VoteHistoryPanel({
  items,
  loading,
}: {
  items: {
    electionId: string;
    candidateId: string;
    txHash: string;
    mode: string;
    createdAt: string;
  }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Memuat riwayat voting...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Belum ada riwayat voting.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Riwayat Voting
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <VoteHistoryRow key={`${item.txHash}-${item.electionId}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function VoteHistoryRow({
  item,
}: {
  item: {
    electionId: string;
    candidateId: string;
    txHash: string;
    mode: string;
    createdAt: string;
  };
}) {
  const explorerBase = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? "";
  const electionId = BigInt(item.electionId);
  const candidateId = BigInt(item.candidateId);
  const { data: election } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "elections",
    args: [electionId],
  });
  const { data: candidate } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "getCandidate",
    args: [electionId, candidateId],
  });

  const title = election ? String(election[0]) : `Event #${item.electionId}`;
  const candidateName = candidate ? String(candidate[1]) : `Kandidat #${item.candidateId}`;
  const shortHash = `${item.txHash.slice(0, 6)}...${item.txHash.slice(-4)}`;
  const explorerUrl =
    explorerBase && item.txHash ? `${explorerBase}/tx/${item.txHash}` : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">
          {candidateName} • {new Date(item.createdAt).toLocaleString("id-ID")}
        </p>
        <p className="mt-1 text-[10px] uppercase text-slate-400">
          Mode: {item.mode}
        </p>
      </div>
      <div className="text-right text-[11px] text-slate-500">
        {explorerUrl ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-slate-700 hover:text-slate-900"
          >
            Tx {shortHash}
          </a>
        ) : (
          <>Tx {shortHash}</>
        )}
      </div>
    </div>
  );
}

function VerificationCard({
  status,
  reason,
  uploading,
  uploadMsg,
  onUpload,
  onCardFileChange,
  onSelfieFileChange,
  cardPreview,
  selfiePreview,
}: {
  status: "NONE" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  reason: string | null;
  uploading: boolean;
  uploadMsg: string | null;
  onUpload: () => void;
  onCardFileChange: (file: File | null) => void;
  onSelfieFileChange: (file: File | null) => void;
  cardPreview: string | null;
  selfiePreview: string | null;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <VerificationStepper status={status} />
      <h3 className="text-sm font-semibold text-slate-900 mt-2">
        Verifikasi Identitas Mahasiswa
      </h3>
      <p className="mt-2 text-xs text-slate-500">
        {status === "PENDING"
          ? "Dokumen sedang ditinjau."
          : "Upload foto kartu mahasiswa dan selfie untuk verifikasi."}
      </p>

      {status === "PENDING" ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Tunggu hingga admin mengonfirmasi verifikasi kamu.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Foto Kartu Mahasiswa
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {cardPreview ? "Siap diunggah" : "Belum ada file"}
                  </p>
                </div>
                <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100">
                  Pilih Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onCardFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {cardPreview ? (
                  <img
                    src={cardPreview}
                    alt="Preview kartu mahasiswa"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                    Preview kartu mahasiswa
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Foto Selfie
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selfiePreview ? "Siap diunggah" : "Belum ada file"}
                  </p>
                </div>
                <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100">
                  Pilih Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onSelfieFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {selfiePreview ? (
                  <img
                    src={selfiePreview}
                    alt="Preview selfie"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-slate-400">
                    Preview selfie
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onUpload}
              disabled={uploading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {uploading ? "Mengirim..." : "Kirim Verifikasi"}
            </button>
            {uploadMsg && <p className="text-xs text-slate-500">{uploadMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
}

function ChangePasswordCard({
  nim,
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  message,
  loading,
  onLogout,
  onSubmit,
}: {
  nim: string;
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  message: string | null;
  loading: boolean;
  onLogout: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Ubah Password Wajib
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Halo {nim}, kamu wajib mengganti password sebelum voting.
      </p>

      <div className="mt-4 space-y-3">
        <input
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          type="password"
          placeholder="Password baru"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
        />
        <input
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          type="password"
          placeholder="Konfirmasi password"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
        {message && <p className="text-xs text-rose-600">{message}</p>}
      </div>
    </div>
  );
}

function OpenElections({ onSelect }: { onSelect: (id: bigint) => void }) {
  const { data: count, isLoading, error } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "electionsCount",
  });

  const electionIds = useMemo(() => {
    const n = Number(count ?? 0n);
    return Array.from({ length: n }, (_, i) => BigInt(i + 1));
  }, [count]);

  if (isLoading) return <p className="text-sm text-slate-500">Memuat event...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;
  if (!count || count === 0n) {
    return <p className="text-sm text-slate-500">Belum ada pemilihan.</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Event Dibuka</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {electionIds.map((id) => (
          <OpenElectionCard
            key={id.toString()}
            electionId={id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function OpenElectionCard({
  electionId,
  onSelect,
}: {
  electionId: bigint;
  onSelect: (id: bigint) => void;
}) {
  const { data: election } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "elections",
    args: [electionId],
  });
  const [nimVoted, setNimVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(false);

  useEffect(() => {
    let ignore = false;
    setCheckingVote(true);
    fetch("/api/student/vote-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ electionId: electionId.toString() }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then((result) => {
        if (ignore) return;
        if (result.ok && result.data?.alreadyVoted === true) {
          setNimVoted(true);
        } else if (result.ok) {
          setNimVoted(false);
        }
      })
      .finally(() => {
        if (!ignore) setCheckingVote(false);
      });

    return () => {
      ignore = true;
    };
  }, [electionId]);

  if (!election) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Memuat event...</p>
      </div>
    );
  }

  const [title, isOpen, candidatesCount, activeCandidatesCount] = election;
  if (!isOpen) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-emerald-600">Open</p>
            {nimVoted && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                Sudah Vote
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            Kandidat aktif: {activeCandidatesCount.toString()}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          #{electionId.toString()}
        </span>
      </div>
      <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-500">Perolehan suara</p>
        <CandidateCounts electionId={electionId} candidatesCount={candidatesCount} />
      </div>
      {checkingVote && (
        <p className="mt-2 text-[11px] text-slate-400">Memeriksa status voting...</p>
      )}
      <button
        onClick={() => onSelect(electionId)}
        disabled={nimVoted}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {nimVoted ? "Sudah Voting" : "Masuk Voting"}
      </button>
    </div>
  );
}

function CandidateCounts({
  electionId,
  candidatesCount,
}: {
  electionId: bigint;
  candidatesCount: bigint;
}) {
  const ids = useMemo(() => {
    const n = Number(candidatesCount ?? 0n);
    return Array.from({ length: n }, (_, i) => BigInt(i + 1));
  }, [candidatesCount]);

  if (candidatesCount === 0n) {
    return <p className="text-slate-400">Belum ada kandidat.</p>;
  }

  return (
    <div className="space-y-1">
      {ids.map((id) => (
        <CandidateCountRow
          key={`${electionId.toString()}-${id.toString()}`}
          electionId={electionId}
          candidateId={id}
        />
      ))}
    </div>
  );
}

function CandidateCountRow({
  electionId,
  candidateId,
}: {
  electionId: bigint;
  candidateId: bigint;
}) {
  const { data } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "getCandidate",
    args: [electionId, candidateId],
  });

  if (!data) return <p>Memuat kandidat...</p>;

  const [, name, voteCount, isActive] = data;
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate">{name}</span>
      <span className="font-semibold text-slate-700">{voteCount.toString()}</span>
    </div>
  );
}
