import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk/dist/lib/types";
import { ethers } from "ethers";

export const getMigrationParams = async (
  secrets: Web3FunctionContext["secrets"]
) => {
  const [minUsd, maxBps, migrationBps] = await Promise.all([
    secrets.get("MIGRATION_MIN_USD_THRESHOLD"),
    secrets.get("MAX_BPS"),
    secrets.get("MIGRATION_BPS"),
  ]);

  if (!minUsd || !maxBps || !migrationBps) {
    throw new Error("❌ Missing one or more migration params in secrets");
  }

  return {
    MIGRATION_MIN_USD_THRESHOLD: ethers.BigNumber.from(minUsd),
    MAX_BPS: Number(maxBps),
    MIGRATION_BPS: Number(migrationBps),
  };
};
