import { network } from "hardhat";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

async function main() {
  const { viem } = await network.connect();

  const contract = await viem.getContractAt(
    "MultiElectionVoting",
    CONTRACT_ADDRESS
  );

  console.log("Creating election: Pemilihan BEM 2025...");

  const tx = await contract.write.createElection([
    "Pemilihan Ketua BEM 2025",
  ]);

  console.log("Waiting for confirmation...");
  await (await viem.getPublicClient()).waitForTransactionReceipt({
    hash: tx,
  });

  console.log("Election created successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
