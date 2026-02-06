param(
  [string]$BesuBin = "besu",
  [string]$GenDir = (Resolve-Path (Join-Path $PSScriptRoot "..\\besu-network-gen-4")).Path,
  [int]$RpcPort = 8545,
  [int]$P2PPort = 30310
)

$ErrorActionPreference = "Stop"

$genesis = Join-Path $GenDir "genesis.json"
$staticNodes = Join-Path $PSScriptRoot "static-nodes.json"
$dataPath = Join-Path $GenDir "data\\rpc"

if (-not (Test-Path $genesis)) {
  throw "Genesis file not found: $genesis"
}
if (-not (Test-Path $staticNodes)) {
  throw "static-nodes.json not found: $staticNodes"
}

$staticContent = Get-Content $staticNodes -Raw
if ($staticContent -notmatch "enode://") {
  throw "static-nodes.json does not contain an enode URL. Update it with validator #1 enode."
}

$args = @(
  "--data-path=`"$dataPath`"",
  "--genesis-file=`"$genesis`"",
  "--p2p-port=$P2PPort",
  "--static-nodes-file=`"$staticNodes`"",
  "--rpc-http-enabled",
  "--rpc-http-host=127.0.0.1",
  "--rpc-http-port=$RpcPort",
  "--rpc-http-api=ETH,NET,WEB3,IBFT",
  "--host-allowlist=*",
  "--rpc-http-cors-origins=*"
)

Write-Host ("Starting RPC node on http://127.0.0.1:{0} (p2p {1})" -f $RpcPort, $P2PPort)
Start-Process -FilePath $BesuBin -ArgumentList ($args -join ' ')
