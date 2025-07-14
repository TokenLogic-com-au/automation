import { ethers } from "ethers";
import { ROLES_MODIFIER_ABI } from "../abis";
import { ROLE_KEY as roleKey } from "../constants";

export async function executeDepositWithRole(
  chainId: number,
  provider: ethers.providers.Provider,
  privateKey: string,
  rolesModifierAddress: string,
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
      to: rolesModifierAddress,
      data: rolesData,
      value: 0,
    });

    await tx.wait();
    console.log(
      `✅ Executed with role on chain ${chainId} — Tx hash: ${tx.hash}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `❌ Error executing transaction on chain ${chainId}:`,
        error.message
      );
    } else {
      console.error(
        `❌ Error executing transaction on chain ${chainId}:`,
        error
      );
    }
  }
}
