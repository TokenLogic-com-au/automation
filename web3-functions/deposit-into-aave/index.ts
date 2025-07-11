import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { buildEncodedCalls } from "./helpers/chainCalls";
import { buildMigrationCalls } from "./helpers/migrationCalls";
import { executeDepositWithRole } from "./helpers/safe";
import { AAVE_DATA_PROVIDER_V3_ABI, STEWARD_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS } from "./constants";
import { getV3ConfigsAndReserves } from "./helpers/getV3Configs";
import { getMigrationParams } from "./helpers/migrationParams";
import { getChainCallParams } from "./helpers/chainCallsParams";

type NetworkKey =
  | "ETHEREUM"
  | "POLYGON"
  | "ARBITRUM"
  | "OPTIMISM"
  | "BASE"
  | "AVALANCHE";

const getNetworkKey = (chainId: number): NetworkKey => {
  const networkMap: Record<number, NetworkKey> = {
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    8453: "BASE",
    43114: "AVALANCHE",
  };

  const network = networkMap[chainId];
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return network;
};

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const migrationParams = await getMigrationParams(secrets);
  const chainCallParams = await getChainCallParams(secrets);

  const privateKey = await secrets.get("PRIVATE_KEY");

  if (!privateKey || !SAFE_ADDRESS) {
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

        const dataProviderContract = new Contract(
          addresses.dataProviderV3,
          AAVE_DATA_PROVIDER_V3_ABI,
          provider
        );

        const { reserves: reservesV3, configs } = await getV3ConfigsAndReserves(
          dataProviderContract
        );

        const [depositCalls, migrationCalls] = await Promise.all([
          buildEncodedCalls(
            provider,
            addresses,
            stewardInterface,
            chainId,
            reservesV3,
            configs,
            chainCallParams
          ),
          buildMigrationCalls(
            provider,
            addresses,
            stewardInterface,
            chainId,
            reservesV3,
            configs,
            migrationParams
          ),
        ]);

        const encodedCalls = [...depositCalls, ...migrationCalls];

        if (!encodedCalls.length) {
          console.log(`ℹ️ No encoded or migration calls for chain ${chainId}`);
          return;
        }

        console.log(
          `📦 Chain ${chainId}: ${depositCalls.length} deposits, ${migrationCalls.length} migrations`
        );

        const multicallData = stewardInterface.encodeFunctionData("multicall", [
          encodedCalls,
        ]);

        await executeDepositWithRole(
          chainId,
          provider,
          privateKey,
          SAFE_ADDRESS,
          addresses.poolExposureSteward,
          multicallData
        );

        console.log(
          `✅ Executed transaction on behalf of Safe on chain ${chainId}`
        );
      } catch (error) {
        console.error(
          `❌ Error processing chain ${chainId}:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    })
  );

  const successes = results.filter((r) => r.status === "fulfilled").length;
  const failures = results.filter((r) => r.status === "rejected").length;

  return {
    canExec: false,
    message: `📝 Multichain executions finished — ✅ ${successes}, ❌ ${failures}`,
  };
});
