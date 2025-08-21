import { ethers } from "ethers";
import { ROLES_MODIFIER_ABI } from "../abis";
import { ROLE_KEY_AAVE_DEPOSITOR as roleKey } from "../constants";

async function getSafeFeeData(provider: ethers.providers.Provider, chainId: number) {
  const feeData = await provider.getFeeData();

  const minPriority = ethers.utils.parseUnits("30", "gwei"); // Polygon floor
  const minFee = ethers.utils.parseUnits("50", "gwei");

  if (chainId == 137) {
    return {
      maxFeePerGas: minFee,
      maxPriorityFeePerGas: minPriority,
    }
  }

  return {
    maxFeePerGas: feeData.maxFeePerGas
      ? feeData.maxFeePerGas
      : minFee,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      ? feeData.maxPriorityFeePerGas
      : minPriority,
  };
}

export async function executeWithRole(
  chainId: number,
  provider: ethers.providers.Provider,
  privateKey: string,
  safeAddress: string,
  target: string,
  callData: string
): Promise<void> {
  const wallet = new ethers.Wallet(privateKey, provider);
  const rolesInterface = new ethers.utils.Interface(ROLES_MODIFIER_ABI);

  const rolesData = rolesInterface.encodeFunctionData(
    "execTransactionWithRole",
    [
      target,
      0, // Ether value of module transaction
      callData,
      0, // Operation type of module transaction
      roleKey,
      true, // Should the function revert on inner execution returning success false?
    ]
  );

  try {
    const { maxFeePerGas, maxPriorityFeePerGas } = await getSafeFeeData(provider, chainId);

    const tx = await wallet.sendTransaction({
      to: safeAddress,
      data: rolesData,
      value: 0,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    });

    await tx.wait();
  } catch (err: any) {
    let msg = "Unknown error";

    if (err instanceof Error) {
      msg = err.message;

      if ((err as any).error?.message) {
        msg = (err as any).error.message;
      } else if ((err as any).body) {
        try {
          const parsed = JSON.parse((err as any).body);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          }
        } catch {}
      }
    } else if (typeof err === "string") {
      msg = err;
    }
    
    throw new Error(`❌ Error executing transaction on chain ${chainId}: ${msg}`);
  }
}
