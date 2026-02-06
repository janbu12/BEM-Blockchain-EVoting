"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PublicResult = {
  electionId: string;
  title: string;
  totalVotes: number;
  snapshotAt: string;
  publishedAt: string | null;
  results: {
    candidates: Array<{
      id: string;
      name: string;
      voteCount: number;
      photoUrl?: string | null;
    }>;
  };
};

export default function PublicResultsPage() {
  const [items, setItems] = useState<PublicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalMs = 15000;

  useEffect(() => {
    let ignore = false;
    const fetchResults = () => {
      setLoading(true);
      fetch("/api/public/results")
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then((result) => {
          if (ignore) return;
          if (result.ok) {
            setItems(result.data.items ?? []);
            setError(null);
          } else {
            setError(result.data?.reason ?? "Gagal memuat hasil");
          }
        })
        .catch(() => {
          if (!ignore) setError("Gagal menghubungi server");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    };
    fetchResults();
    const id = window.setInterval(fetchResults, pollIntervalMs);
    return () => {
      ignore = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
          Hasil Pemilihan
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Rekapitulasi Resmi
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Berikut daftar event yang sudah dipublikasikan oleh admin.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Memuat hasil...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Belum ada hasil yang dipublikasikan.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <ResultsCard key={item.electionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsCard({ item }: { item: PublicResult }) {
  const candidates = item.results?.candidates ?? [];
  const totalVotes = item.totalVotes ?? 0;
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const topVote =
    candidates.length === 0
      ? 0
      : Math.max(...candidates.map((candidate) => candidate.voteCount));
  const topCount =
    topVote > 0 ? candidates.filter((candidate) => candidate.voteCount === topVote).length : 0;
  const isTieTop = topCount > 1;
  const isCompact = sorted.length <= 2;
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sorted.slice(0, 3).forEach((candidate, index) => {
      map.set(candidate.id, index + 1);
    });
    return map;
  }, [sorted]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            Event #{item.electionId} • Dipublikasikan{" "}
            {item.publishedAt
              ? new Date(item.publishedAt).toLocaleString("id-ID")
              : "-"}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          Total suara: {totalVotes}
        </div>
      </div>

      <div
        className={
          isCompact
            ? "mt-6 flex flex-wrap justify-center gap-4"
            : "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {sorted.map((candidate) => (
          <div
            key={`${item.electionId}-${candidate.id}`}
            className={isCompact ? "w-full max-w-[280px]" : "w-full"}
          >
            <CandidateCard
              candidate={candidate}
              rank={rankMap.get(candidate.id)}
              isTieTop={isTieTop}
              topVote={topVote}
            />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-center text-sm font-semibold text-slate-700">
          Persebaran Suara {item.title}
        </p>
        <div className="mt-4 h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ResultsChart candidates={sorted} totalVotes={totalVotes} />
        </div>
      </div>
    </section>
  );
}

function CandidateCard({
  candidate,
  rank,
  isTieTop,
  topVote,
}: {
  candidate: {
    id: string;
    name: string;
    voteCount: number;
    photoUrl?: string | null;
  };
  rank?: number;
  isTieTop: boolean;
  topVote: number;
}) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
  const rawPhoto = candidate.photoUrl ?? null;
  const resolvedPhoto =
    rawPhoto && rawPhoto.startsWith("/") ? `${backendBase}${rawPhoto}` : rawPhoto;
  const isTop = candidate.voteCount > 0 && candidate.voteCount === topVote;
  const showWinner = isTop && !isTieTop;
  const showTie = isTop && isTieTop;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {rank && (
        <span className="absolute left-4 top-4 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
          #{rank}
        </span>
      )}
      {(showWinner || showTie) && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
          {showWinner ? "Winner" : "Seri"}
        </span>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {resolvedPhoto ? (
          <img
            src={resolvedPhoto}
            alt={`Foto ${candidate.name}`}
            className="h-full w-full object-cover"
            style={{ aspectRatio: "3 / 4" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400" style={{ aspectRatio: "3 / 4" }}>
            Foto
          </div>
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
        <span className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {candidate.voteCount} suara
        </span>
      </div>
    </div>
  );
}

function ResultsChart({
  candidates,
  totalVotes,
}: {
  candidates: Array<{ id: string; name: string; voteCount: number }>;
  totalVotes: number;
}) {
  const palette = [
    "#0ea5e9",
    "#22c55e",
    "#f97316",
    "#a855f7",
    "#facc15",
    "#14b8a6",
    "#ef4444",
    "#6366f1",
    "#84cc16",
    "#ec4899",
  ];
  const getBarColor = (index: number) => {
    if (index < palette.length) return palette[index];
    const hue = (index * 47) % 360;
    return `hsl(${hue} 70% 50%)`;
  };
  const data = candidates.map((candidate) => ({
    label: candidate.name,
    votes: candidate.voteCount,
    pct:
      totalVotes === 0
        ? 0
        : Math.round((candidate.voteCount / totalVotes) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip content={<ResultsTooltip />} />
        <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`bar-${entry.label}-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ResultsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { label: string; votes: number; pct: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{entry.label}</p>
      <p className="text-slate-500">{entry.votes} suara</p>
      <p className="text-slate-500">{entry.pct}%</p>
    </div>
  );
}
