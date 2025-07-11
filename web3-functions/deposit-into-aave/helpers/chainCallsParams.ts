import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk/dist/lib/types";
import { BigNumber } from "ethers";

export const getChainCallParams = async (
  secrets: Web3FunctionContext["secrets"]
) => {
  const rawMinUsd = await secrets.get("CHAINCALL_MIN_USD_THRESHOLD");

  if (!rawMinUsd) {
    throw new Error("❌ Missing CHAINCALL_MIN_USD_THRESHOLD in secrets");
  }

  if (isNaN(Number(rawMinUsd))) {
    throw new Error(`❌ Invalid CHAINCALL_MIN_USD_THRESHOLD: ${rawMinUsd}`);
  }

  const CHAINCALL_MIN_USD_THRESHOLD = BigNumber.from(rawMinUsd);

  return { CHAINCALL_MIN_USD_THRESHOLD };
};
