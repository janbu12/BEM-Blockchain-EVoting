"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProgressItem = {
  electionId: string;
  title: string;
  isOpen: boolean;
  mode: number;
  startTime: number;
  endTime: number;
  totalVotes: number;
  candidates: Array<{
    id: string;
    voteCount: number;
  }>;
};

function formatTime(ts: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("id-ID");
}

export default function PublicProgressPage() {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalMs = 10000;

  useEffect(() => {
    let ignore = false;
    const fetchProgress = () => {
      setLoading(true);
      fetch("/api/public/progress")
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then((result) => {
          if (ignore) return;
          if (result.ok) {
            setItems(result.data.items ?? []);
            setError(null);
          } else {
            setError(result.data?.reason ?? "Gagal memuat progress");
          }
        })
        .catch(() => {
          if (!ignore) setError("Gagal menghubungi server");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    };
    fetchProgress();
    const id = window.setInterval(fetchProgress, pollIntervalMs);
    return () => {
      ignore = true;
      window.clearInterval(id);
    };
  }, []);

  const activeItems = useMemo(() => items, [items]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
          Progress Voting
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Perolehan Suara Sementara
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ini adalah ringkasan perolehan suara saat ini tanpa identitas pemilih.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Memuat progress...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Belum ada data.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Event Aktif</h2>
            {activeItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                Belum ada event yang sedang berlangsung.
              </div>
            ) : (
              activeItems.map((item) => (
                <ProgressCard key={item.electionId} item={item} />
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ProgressCard({ item }: { item: ProgressItem }) {
  const seedRef = useRef<number | null>(null);
  if (seedRef.current === null) {
    seedRef.current = Math.floor(Math.random() * 1_000_000_000);
  }
  const shuffledCandidates = useMemo(() => {
    const seed = seedRef.current ?? 1;
    const rng = mulberry32(seed + Number(item.electionId));
    const copy = [...item.candidates];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [item.candidates, item.electionId]);

  const activeCount = shuffledCandidates.length;
  const totalVotes = item.totalVotes ?? 0;
  const candidateRows = shuffledCandidates.map((candidate, index) => ({
    label: `Pilihan ${index + 1}`,
    votes: candidate.voteCount,
    pct:
      totalVotes === 0
        ? 0
        : Math.round((candidate.voteCount / totalVotes) * 100),
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            Event #{item.electionId} • {item.isOpen ? "Open" : "Closed"} •{" "}
            {item.mode === 1 ? "Production" : "Manual"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Buka: {formatTime(item.startTime)} • Tutup: {formatTime(item.endTime)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          Total suara: {item.totalVotes}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          Kandidat aktif: {activeCount}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
          Total suara: {item.totalVotes}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {candidateRows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span className="font-medium">{row.label}</span>
              <span className="text-xs text-slate-500">{row.pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
