import { ethers } from "ethers";

export async function executeDepositWithRole(
  chainId: number,
  provider: ethers.providers.Provider,
  privateKey: string,
  rolesModifierAddress: string,
  target: string,
  callData: string 
) {
  const wallet = new ethers.Wallet(privateKey, provider);

  const roleKey = '0x616176655f6465706f7369746f72000000000000000000000000000000000000';

  const rolesInterface = new ethers.utils.Interface([
    "function execTransactionWithRole(address,uint256,bytes,uint8,bytes32,bool)",
  ]);

  const rolesData = rolesInterface.encodeFunctionData("execTransactionWithRole", [
    target, 
    0,
    callData,  
    0,           
    roleKey,
    false         
  ]);

  try {
    const tx = await wallet.sendTransaction({
      to: rolesModifierAddress,
      data: rolesData,
      value: 0,
    });

    await tx.wait();
    
    console.log(`✅ Executed with role on chain ${chainId} — Tx hash: ${tx.hash}`);
  } catch (error) {
    console.error(`❌ Error executing transacti
      on on chain ${chainId}:`, error);
  }
}
