import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { ethers } from "ethers";
import { getProviderMap } from "./helpers/providers";
import { getEncodedCallsForChain } from "./helpers/chainCalls";
import { proposeSafeMulticall } from "./helpers/safe";
import { STEWARD_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS } from "./constants";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const privateKey = await secrets.get("PRIVATE_KEY");
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");
  const sharedSafeAddress = SAFE_ADDRESS;

  const rpcUrls: Record<number, string> = {
    1: (await secrets.get("RPC_URL_ETHEREUM")) || "",
    137: (await secrets.get("RPC_URL_POLYGON")) || "",
    42161: (await secrets.get("RPC_URL_ARBITRUM")) || "",
    10: (await secrets.get("RPC_URL_OPTIMISM")) || "",
    8453: (await secrets.get("RPC_URL_BASE")) || "",
  };

  if (!relayApiKey || !privateKey || !sharedSafeAddress) {
    return {
      canExec: false,
      message: "🔑 Missing required secrets (GELATO_RELAY_API_KEY, PRIVATE_KEY, SAFE_ADDRESS)",
    };
  }

  const providers = getProviderMap(rpcUrls);
  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  for (const [chainIdStr, addresses] of Object.entries(AAVE_ADDRESSES)) {
    const chainId = Number(chainIdStr);
    const provider = providers[chainId];
    const rpcUrl = rpcUrls[chainId as keyof typeof rpcUrls];

    if (!provider || !rpcUrl) {
      console.warn(`⚠️ Skipping chain ${chainId}: missing provider or RPC URL`);
      continue;
    }

    const encodedCalls = await getEncodedCallsForChain(provider, addresses, stewardInterface);
    if (!encodedCalls.length) continue;

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
  }

  return {
    canExec: false,
    message: "📝 Multichain deposit proposals created successfully.",
  };
});