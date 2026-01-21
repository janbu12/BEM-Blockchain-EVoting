import { network } from "hardhat";

const CONTRACT_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9";
const ELECTION_ID = 1n;

async function main() {
  const { viem } = await network.connect();

  const contract = await viem.getContractAt(
    "MultiElectionVoting",
    CONTRACT_ADDRESS
  );

  console.log("Opening election:", ELECTION_ID.toString());

  const tx = await contract.write.openElection([ELECTION_ID]);

  await (await viem.getPublicClient()).waitForTransactionReceipt({
    hash: tx,
  });

  console.log("Election is now OPEN");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
