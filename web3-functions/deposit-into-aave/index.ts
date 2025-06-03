import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { ethers } from "ethers";
import { buildEncodedCalls } from "./helpers/chainCalls";
import { proposeSafeMulticall } from "./helpers/safe";
import { STEWARD_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS } from "./constants";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const privateKey = await secrets.get("PRIVATE_KEY");
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");
  const sharedSafeAddress = SAFE_ADDRESS;

  const getNetworkKey = (chainId: number): string => ({
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    8453: "BASE",
  }[chainId] || "");

  if (!relayApiKey || !privateKey || !sharedSafeAddress) {
    return {
      canExec: false,
      message: "🔑 Missing required secrets (GELATO_RELAY_API_KEY, PRIVATE_KEY, SAFE_ADDRESS)",
    };
  }

  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  const results = await Promise.allSettled(
    Object.entries(AAVE_ADDRESSES).map(async ([chainIdStr, addresses]) => {
      const chainId = Number(chainIdStr);
      const networkKey = getNetworkKey(chainId);
      const rpcUrl = (await secrets.get(`RPC_URL_${networkKey}`)) || "";

      if (!rpcUrl) {
        console.warn(`⚠️ Skipping chain ${chainId}: missing RPC URL`);
        return;
      }

      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const encodedCalls = await buildEncodedCalls(provider, addresses, stewardInterface);
        if (!encodedCalls.length) {
          console.log(`ℹ️ No encoded calls for chain ${chainId}`);
          return;
        }

        const multicallData = stewardInterface.encodeFunctionData("multicall", [encodedCalls]);

        await proposeSafeMulticall(
          chainId,
          provider,
          rpcUrl,
          privateKey,
          sharedSafeAddress,
          addresses.poolExposureSteward,
          multicallData
        );

        console.log(`✅ Proposed transaction to Safe on chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Error processing chain ${chainId}:`, error);
      }
    })
  );

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results.filter(r => r.status === "rejected").length;

  return {
    canExec: false,
    message: `📝 Multichain proposals finished — ✅ ${successes}, ❌ ${failures}`,
  };
});
