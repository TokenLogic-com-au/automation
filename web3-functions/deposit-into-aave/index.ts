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
import { sendTelegramAlert } from "./helpers/sendTelegramAlert";

type NetworkKey =
  | "ETHEREUM"
  | "POLYGON"
  | "ARBITRUMONE"
  | "OPTIMISM"
  | "BASE"
  | "AVALANCHE";

const getNetworkKey = (chainId: number): NetworkKey => {
  const networkMap: Record<number, NetworkKey> = {
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUMONE",
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

const MAX_GELATO_RUNTIME = 30;

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, secrets, storage } = context;
  const start = Date.now();

  try {
    const lastExecuted = Number((await storage.get("lastExecuted")) ?? "0");
    const nextRun = lastExecuted + Number(userArgs.waitTimeUntilNextRun);
    if (start < nextRun) {
      const nextRunStr = new Date(nextRun).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        canExec: false,
        message: `Wait time until next run has not passed. Next run on ${nextRunStr}.`,
      };
    }

    const privateKey = await secrets.get("PRIVATE_KEY");
    if (!privateKey) {
      return { canExec: false, message: "Missing required PRIVATE_KEY" };
    }

    const chainId = Number(await secrets.get("CHAIN_ID"));
    if (!chainId) {
      return { canExec: false, message: "Missing required CHAIN_ID" };
    }

    const rpcUrl = await secrets.get(`RPC_URL_${getNetworkKey(chainId)}`);
    if (!rpcUrl) {
      return {
        canExec: false,
        message: `Missing RPC URL for chain ${chainId}`,
      };
    }

    const addresses = AAVE_ADDRESSES[chainId];
    if (!addresses || !addresses.roles) {
      return { canExec: false, message: `Unsupported chain ${chainId}` };
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

    const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);
    const migrationParams = await getMigrationParams(userArgs);
    const depositCallParams = await getDepositCallParams(userArgs);

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
        message: `No deposit or migration calls for chainId: ${chainId} at this time`,
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

    const duration = (Date.now() - start) / 1000;
    console.log(`Script Duration: ${duration} seconds.`);

    if (duration > MAX_GELATO_RUNTIME) {
      const TELEGRAM_BOT_TOKEN = await secrets.get("TELEGRAM_BOT_TOKEN");
      const TELEGRAM_CHAT_ID = await secrets.get("TELEGRAM_CHAT_ID");

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        await sendTelegramAlert(
          TELEGRAM_BOT_TOKEN,
          TELEGRAM_CHAT_ID,
          chainId,
          duration
        );
      }
    }

    return {
      canExec: false,
      message: `Execution finished for chainId: ${chainId}. Runtime: ${duration} seconds.`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { canExec: false, message: msg };
  }
});
