"use client";

import * as React from "react";
import { Connector, useConnect, useConnectors } from "wagmi";

export function WalletOptions() {
  const [mounted, setMounted] = React.useState(false);
  const { connect } = useConnect()
  const connectors = useConnectors()

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
    </div>
  );
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button
      disabled={!ready}
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
        ready
          ? "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-sm"
          : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
      }`}
    >
      <span>{connector.name}</span>
      <span className="text-xs text-slate-400">Connect</span>
    </button>
  )
}
