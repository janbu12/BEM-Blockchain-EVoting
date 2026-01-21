"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { VOTING_ABI, VOTING_ADDRESS } from "@/lib/contract";
import { AdminActions } from "./AdminActions";

export function AdminPanel() {
  const { address } = useAccount();
  const { data: electionsCount } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "electionsCount",
  });
  const { data: adminAddress } = useReadContract({
    address: VOTING_ADDRESS,
    abi: VOTING_ABI,
    functionName: "admin",
  });

  const isAdmin =
    !!address &&
    !!adminAddress &&
    address.toLowerCase() === String(adminAddress).toLowerCase();

  const electionIds = useMemo(() => {
    const n = Number(electionsCount ?? 0n);
    return Array.from({ length: n }, (_, i) => BigInt(i + 1));
  }, [electionsCount]);

  if (!address) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-xl font-semibold text-slate-900">Admin Panel</h2>
      <p className="mt-2 text-sm text-slate-600">
        Status:{" "}
        <span
          className={`font-semibold ${
            isAdmin ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {isAdmin ? "Admin" : "Bukan admin"}
        </span>
      </p>
      {isAdmin ? (
        <AdminActions electionIds={electionIds} />
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Hanya admin yang bisa mengelola event.
        </p>
      )}
    </div>
  );
}
