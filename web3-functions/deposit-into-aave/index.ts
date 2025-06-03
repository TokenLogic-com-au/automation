import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { ethers } from "ethers";
import { getProvider } from "./helpers/providers"; 
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

  for (const [chainIdStr, addresses] of Object.entries(AAVE_ADDRESSES)) {
    const chainId = Number(chainIdStr);
    const rpcKey = `RPC_URL_${getNetworkKey(chainId)}`;
    const rpcUrl = (await secrets.get(rpcKey)) || "";
    const rpcUrls = { [chainId]: rpcUrl };
    const provider = getProvider(chainId, rpcUrls);

    if (!provider || !rpcUrl) {
      console.warn(`⚠️ Skipping chain ${chainId}: missing provider or RPC URL`);
      continue;
    }

    const encodedCalls = await buildEncodedCalls(provider, addresses, stewardInterface);
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
