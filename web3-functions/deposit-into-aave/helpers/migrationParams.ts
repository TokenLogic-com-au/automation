import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk/dist/lib/types";
import { ethers } from "ethers";

export const getMigrationParams = async (
  userArgs: Web3FunctionContext["userArgs"]
) => {

  const { migrationMinUsdThreshold, maxBps, migrationBps} = userArgs;

  if (!migrationMinUsdThreshold || !maxBps || !migrationBps ) {
    throw new Error("❌ Missing one or more migration params in secrets");
  }

  return {
    migrationMinUsdThreshold: ethers.BigNumber.from(migrationMinUsdThreshold),
    maxBps: Number(maxBps),
    migrationBps: Number(migrationBps),
  };
};
