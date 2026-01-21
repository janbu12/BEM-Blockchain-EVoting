import { network } from "hardhat";

async function main() {
  const { viem, networkName } = await network.connect();
  const publicClient = await viem.getPublicClient();

  console.log(`Deploying VotingBEM to ${networkName}...`);

  const candidateNames = [
    "Calon Ketua A",
    "Calon Ketua B",
    "Calon Ketua C",
  ];

  const voting = await viem.deployContract(
    "VotingBEM",
    [candidateNames]
  );

  console.log("VotingBEM deployed at:", voting.address);

  console.log("Deployment successful!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
