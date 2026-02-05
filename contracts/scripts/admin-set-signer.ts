import { network } from "hardhat";

const CONTRACT_ADDRESS = "0x7ccb2c4e01cda4fda7781a5f74559f1657fb6477";
const NEW_SIGNER = "0xc4340660ac0a5CFaab744Be93c97e6C47f608002";

async function main() {
  const { viem } = await network.connect();
  const contract = await viem.getContractAt("MultiElectionVoting", CONTRACT_ADDRESS);

  const tx = await contract.write.setSigner([NEW_SIGNER]);
  await (await viem.getPublicClient()).waitForTransactionReceipt({ hash: tx });

  console.log("Signer updated to:", NEW_SIGNER);
}
main().catch(console.error);
