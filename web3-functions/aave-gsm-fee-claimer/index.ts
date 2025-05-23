import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";


const MIN_FEE_THRESHOLD_WEI = 100_000_000_000_000_000_000n;

type GSMAbiInput = {
  inputs: Array<{ internalType?: string; name?: string; type: string }>;
  name: string;
  outputs?: Array<{ internalType: string; name: string; type: string }>;
  stateMutability: string;
  type: string;
}

const AAVE_GSM_ABI: GSMAbiInput[] = [
  {
    inputs: [],
    name: "distributeFeesToTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAccruedFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const gelatoRelay = new GelatoRelay();

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider, secrets, storage } = context;

  if (!userArgs.gsms || !Array.isArray(userArgs.gsms) || !userArgs.duration || typeof userArgs.duration !== 'number') {
    return { canExec: false, message: "Invalid user arguments. Required: gsms (string[]) and duration (number)" };
  }

  if (!userArgs.gsms.every((gsm): gsm is string => typeof gsm === 'string')) {
    return { canExec: false, message: "Invalid GSM format. All GSM entries must be strings in format 'chainId:address'" };
  }

  const { gsms, duration } = userArgs;

  const lastExecutionTime = Number((await storage.get("lastExecutionTime")) ?? "0");
  const currentTimestamp = Date.now();

  const gelatoApiKey = 'FpXloc43d1v8Zamp70ciJ4_HWQMmzVoSTr_5RnoCOKs_'
  if (!gelatoApiKey) {
    return { canExec: false, message: "Gelato Relay API Key not configured" };
  }

  if (currentTimestamp < lastExecutionTime + duration) {
    return { canExec: false, message: "Minimum duration between claims not reached" };
  }

  let anyExecuted = false;
  
  for (const gsm of gsms) {
    const [targetChainId, gsmContractAddress] = gsm.split(":");
    if (!targetChainId || !gsmContractAddress) {
      console.log(`Invalid GSM format: ${gsm}. Expected 'chainId:address'`);
      continue;
    }

    const gsmContract = new Contract(
      gsmContractAddress,
      AAVE_GSM_ABI,
      multiChainProvider.chainId(Number(targetChainId))
    );

    const accruedFees = await gsmContract.getAccruedFees();
    console.log(`Chain ${targetChainId}, GSM ${gsmContractAddress}, Accrued Fees: ${accruedFees}`);

    if (accruedFees < MIN_FEE_THRESHOLD_WEI) {
      console.log(`Skipping GSM ${gsmContractAddress} - fees below threshold`);
      continue;
    }

    try {
      await gelatoRelay.sponsoredCall(
        {
          chainId: BigInt(targetChainId),
          target: gsmContractAddress,
          data: gsmContract.interface.encodeFunctionData("distributeFeesToTreasury", []),
        },
        gelatoApiKey
      );
      anyExecuted = true;
      console.log(`Successfully distributed fees for GSM ${gsmContractAddress}`);
    } catch (error) {
      console.error(`Error distributing fees for GSM ${gsmContractAddress}:`, error);
    }
  }

  await new Promise((res) => setTimeout(res, 2000)); 

  if (anyExecuted) {
    await storage.set("lastExecutionTime", currentTimestamp.toString());
  }

  return {
    canExec: false,
    message: anyExecuted ? "Fee distribution completed successfully" : "No GSMs met the threshold for fee distribution",
  };
});