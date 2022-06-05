import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const ReferralWood = await ethers.getContractFactory("ReferralWood", signer);
  const referralWood = await ReferralWood.deploy();

  await referralWood.deployed();

  console.log("ReferralWood contract deployed to:", referralWood.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
