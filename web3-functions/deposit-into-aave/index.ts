import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { ethers } from "ethers";
import { buildEncodedCalls } from "./helpers/chainCalls";
import { executeDepositWithRole } from "./helpers/safe";
import { STEWARD_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS } from "./constants";

type NetworkKey = "ETHEREUM" | "POLYGON" | "ARBITRUM" | "OPTIMISM" | "BASE";

const getNetworkKey = (chainId: number): NetworkKey => {
  const networkMap: Record<number, NetworkKey> = {
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    8453: "BASE",
  };
  
  const network = networkMap[chainId];
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  return network;
};

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const privateKey = await secrets.get("PRIVATE_KEY");
  const sharedSafeAddress = SAFE_ADDRESS;

  if (!privateKey || !sharedSafeAddress) {
    return {
      canExec: false,
      message: "🔑 Missing required secrets (PRIVATE_KEY, SAFE_ADDRESS)",
    };
  }

  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  const results = await Promise.allSettled(
    Object.entries(AAVE_ADDRESSES).map(async ([chainIdStr, addresses]) => {
      const chainId = Number(chainIdStr);
      
      try {
        const networkKey = getNetworkKey(chainId);
        const rpcUrl = await secrets.get(`RPC_URL_${networkKey}`);

        if (!rpcUrl) {
          throw new Error(`Missing RPC URL for chain ${chainId}`);
        }

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const encodedCalls = await buildEncodedCalls(provider, addresses, stewardInterface, chainId);
        
        if (!encodedCalls.length) {
          console.log(`ℹ️ No encoded calls for chain ${chainId}`);
          return;
        }

        const multicallData = stewardInterface.encodeFunctionData("multicall", [encodedCalls]);

        await executeDepositWithRole(
          chainId,
          provider,
          privateKey,
          sharedSafeAddress,
          addresses.poolExposureSteward,
          multicallData
        );
        
        console.log(`✅ Executed transaction on behalf of Safe on chain ${chainId}`);
      } catch (error) {
        console.error(`❌ Error processing chain ${chainId}:`, error instanceof Error ? error.message : error);
        throw error; // Re-throw to be caught by Promise.allSettled
      }
    })
  );

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results.filter(r => r.status === "rejected").length;

  return {
    canExec: false,
    message: `📝 Multichain executions finished — ✅ ${successes}, ❌ ${failures}`,
  };
});
