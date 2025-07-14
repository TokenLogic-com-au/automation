import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk/dist/lib/types";
import { BigNumber } from "ethers";

export const getDepositCallParams = async (
  secrets: Web3FunctionContext["secrets"]
) => {
  const rawMinUsd = await secrets.get("DEPOSITCALL_MIN_USD_THRESHOLD");

  if (!rawMinUsd) {
    throw new Error("❌ Missing DEPOSITCALL_MIN_USD_THRESHOLD in secrets");
  }

  if (isNaN(Number(rawMinUsd))) {
    throw new Error(`❌ Invalid DEPOSITCALL_MIN_USD_THRESHOLD: ${rawMinUsd}`);
  }

  const DEPOSITCALL_MIN_USD_THRESHOLD = BigNumber.from(rawMinUsd);

  return { DEPOSITCALL_MIN_USD_THRESHOLD };
};
