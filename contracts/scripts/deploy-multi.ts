import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function updateEnvFile(filePath: string, key: string, value: string) {
  const line = `${key}=${value}`;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${line}\n`, "utf8");
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const idx = lines.findIndex((entry) => entry.startsWith(`${key}=`));

  if (idx >= 0) {
    lines[idx] = line;
  } else {
    lines.push(line);
  }

  fs.writeFileSync(filePath, lines.filter((l) => l.length > 0).join("\n") + "\n", "utf8");
}

async function main() {
  const { viem, networkName } = await network.connect();

  console.log(`Deploying MultiElectionVoting to ${networkName}...`);

  const contract = await viem.deployContract("MultiElectionVoting");

  console.log("MultiElectionVoting deployed at:", contract.address);

  const repoRoot = path.resolve(process.cwd(), "..");
  const frontendEnvPath = path.join(repoRoot, "frontend", ".env");
  updateEnvFile(frontendEnvPath, "NEXT_PUBLIC_VOTING_ADDRESS", contract.address);
  console.log("Saved NEXT_PUBLIC_VOTING_ADDRESS to frontend/.env");

  execSync("node scripts/sync-abi.mjs", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
