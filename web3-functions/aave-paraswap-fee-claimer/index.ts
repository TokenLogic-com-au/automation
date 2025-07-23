import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Network } from "./helpers/constants";
import { updateTokenDecimals } from "./updateTokenDecimals";
import { claimFees } from "./claimFees";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider, secrets, storage } = context;

  const { chainIds, duration } = userArgs as {
    chainIds: Network[];
    duration: number;
  };

  const nextIndex = Number((await storage.get("nextIndex")) ?? "0");
  const rawDecimals = await storage.get("decimals");
  let tokenDecimals: Record<string, number> =
    typeof rawDecimals === "string" ? JSON.parse(rawDecimals) : {};

  const lastExecuted = Number((await storage.get(`${nextIndex}`)) ?? "0");
  const now = Date.now();

  const relayApiKey = await secrets.get("RELAY_API_KEY");
  if (!relayApiKey) {
    tokenDecimals = await updateTokenDecimals(
      nextIndex,
      chainIds,
      multiChainProvider,
      tokenDecimals
    );
    await storage.set("decimals", JSON.stringify(tokenDecimals));
    return { canExec: false, message: "Sponsor API Key not configured" };
  }

  if (now < lastExecuted + duration) {
    tokenDecimals = await updateTokenDecimals(
      nextIndex,
      chainIds,
      multiChainProvider,
      tokenDecimals
    );
    await storage.set("decimals", JSON.stringify(tokenDecimals));
    await storage.set(
      "nextIndex",
      ((nextIndex + 1) % chainIds.length).toString()
    );
    return {
      canExec: false,
      message: "Minimum time between claims not reached",
    };
  }

  const result = await claimFees(
    chainIds[nextIndex],
    multiChainProvider.chainId(chainIds[nextIndex]),
    relayApiKey,
    tokenDecimals
  );

  if (result.success) {
    await storage.set(
      "nextIndex",
      ((nextIndex + 1) % chainIds.length).toString()
    );
  }

  await storage.set(`${nextIndex}`, now.toString());
  await storage.set("decimals", JSON.stringify(result.decimals));

  return {
    canExec: false,
    message: "Successfully claimed tokens",
  };
});
