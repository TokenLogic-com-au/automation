import { ethers } from "ethers";
import { ROLES_MODIFIER_ABI } from "../abis";
import { ROLE_KEY_AAVE_DEPOSITOR as roleKey } from "../constants";

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
      false, // Should the function revert on inner execution returning success false?
    ]
  );

  try {
    const tx = await wallet.sendTransaction({
      to: safeAddress,
      data: rolesData,
      value: 0,
    });

    await tx.wait();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`❌ Error executing transaction on chain ${chainId}: ${error.message}`);
    } else {
      throw new Error(`❌ Error executing transaction on chain ${chainId}: ${error}`);
    }
  }
}
