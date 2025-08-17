import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { buildDepositCalls } from "./helpers/depositCalls";
import { buildMigrationCalls } from "./helpers/migrationCalls";
import { executeWithRole } from "./helpers/safe";
import { AAVE_DATA_PROVIDER_V3_ABI, STEWARD_ABI } from "./abis";
import { AAVE_ADDRESSES } from "./constants";
import { getV3ConfigsAndReserves } from "./helpers/getV3Configs";
import { getMigrationParams } from "./helpers/migrationParams";
import { getDepositCallParams } from "./helpers/depositCallsParams";

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
  const { userArgs, secrets, storage } = context;

  const lastExecuted = Number((await storage.get("lastExecuted")) ?? "0");
  const nextRun = lastExecuted + Number(userArgs.waitTimeUntilNextRun);
  if (Date.now() < nextRun) {
    const nextRunStr = new Date(nextRun).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return {
      canExec: false,
      message: `🔑 Wait time until next run has not passed. Next run on ${nextRunStr}`,
    };
  }

  const migrationParams = await getMigrationParams(userArgs);
  const depositCallParams = await getDepositCallParams(userArgs);

  const privateKey = await secrets.get("PRIVATE_KEY");

  if (!privateKey) {
    return {
      canExec: false,
      message: "🔑 Missing required PRIVATE_KEY",
    };
  }

  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  const results = await Promise.allSettled(
    Object.entries(AAVE_ADDRESSES).map(async ([chainIdStr, addresses]) => {
      if (!addresses.roles) {
        return {
          canExec: false,
          message: "🔑 Missing required ROLES ADDRESS",
        };
      }

      const chainId = Number(chainIdStr);

      try {
        const networkKey = getNetworkKey(chainId);
        const rpcUrl = await secrets.get(`RPC_URL_${networkKey}`);

        if (!rpcUrl) {
          return {
            canExec: false,
            message: `Missing RPC URL for chain ${chainId}`,
          };
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
          buildDepositCalls(
            provider,
            addresses,
            stewardInterface,
            chainId,
            reservesV3,
            configs,
            depositCallParams
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
          return {
            canExec: false,
            message: `ℹ️ No encoded or migration calls for chain ${chainId}`,
          };
        }

        const multicallData = stewardInterface.encodeFunctionData("multicall", [
          encodedCalls,
        ]);

        await executeWithRole(
          chainId,
          provider,
          privateKey,
          addresses.roles,
          addresses.poolExposureSteward,
          multicallData
        );

        await storage.set("lastExecuted", Date.now().toString());
      } catch (error) {
        const msg = error instanceof Error ? error.message : error;
        return {
          canExec: false,
          message: `${msg}`,
        };
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
