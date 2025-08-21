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

  const start = Date.now();

  try {
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
        message: `Wait time until next run has not passed. Next run on ${nextRunStr}`,
      };
    }

    const migrationParams = await getMigrationParams(userArgs);
    const depositCallParams = await getDepositCallParams(userArgs);

    const privateKey = await secrets.get("PRIVATE_KEY");
    if (!privateKey) {
      return { canExec: false, message: "Missing required PRIVATE_KEY" };
    }

    const targetChainIdStr = await secrets.get("TARGET_CHAIN_ID");
    if (!targetChainIdStr) {
      return { canExec: false, message: "Missing required TARGET_CHAIN_ID" };
    }

    const chainId = Number(targetChainIdStr);
    const addresses = AAVE_ADDRESSES[chainId];
    if (!addresses || !addresses.roles) {
      return { canExec: false, message: `Unsupported chain ${chainId}` };
    }

    const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);
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
        message: `No encoded or migration calls for chain ${chainId}`,
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
    
    const end = Date.now();
    const duration = (end - start) / 1000;

    console.log(`Duration: ${duration}s`);

    const TELEGRAM_BOT_TOKEN = await secrets.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = await secrets.get("TELEGRAM_CHAT_ID");
    const ALERT_THRESHOLD = Number(
      (await secrets.get("ALERT_THRESHOLD")) ?? "30"
    );

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && duration > ALERT_THRESHOLD) {
      await sendTelegramAlert(
        TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID,
        chainId,
        duration
      );
    }

    return {
      canExec: false,
      message: `Execution finished — chain ${chainId} (took ${duration}s)`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { canExec: false, message: msg };
  }
});
