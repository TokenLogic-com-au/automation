import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk/dist/lib/types";
import { BigNumber } from "ethers";

export const getDepositCallParams = async (
  userArgs: Web3FunctionContext["userArgs"]
) => {
  const { depositCallMinUsdThreshold } = userArgs;

  if (!depositCallMinUsdThreshold) {
    throw new Error("❌ Missing depositCallMinUsdThreshold in userArgs");
  }

  if (isNaN(Number(depositCallMinUsdThreshold))) {
    throw new Error(`❌ Invalid depositCallMinUsdThreshold: ${depositCallMinUsdThreshold}`);
  }

  return { depositCallMinUsdThreshold: BigNumber.from(depositCallMinUsdThreshold)};
};
