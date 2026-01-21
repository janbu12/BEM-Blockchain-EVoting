import { network } from "hardhat";

const CONTRACT_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9";
const ELECTION_ID = 1n;

async function main() {
  const { viem } = await network.connect();

  const contract = await viem.getContractAt(
    "MultiElectionVoting",
    CONTRACT_ADDRESS
  );

  console.log("Adding candidates to election:", ELECTION_ID);

  const candidates = [
    "Calon Ketua BEM A",
    "Calon Ketua BEM B",
    "Calon Ketua BEM C",
  ];

  for (const name of candidates) {
    console.log(`Adding candidate: ${name}`);
    const tx = await contract.write.addCandidate([ELECTION_ID, name]);

    await (await viem.getPublicClient()).waitForTransactionReceipt({
      hash: tx,
    });
  }

  console.log("All candidates added successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
