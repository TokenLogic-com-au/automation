import { ethers } from "ethers";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";

export async function proposeSafeMulticall(
  chainId: number,
  provider: ethers.providers.Provider,
  rpcUrl: string,
  privateKey: string,
  safeAddress: string,
  to: string,
  data: string
) {
  const wallet = new ethers.Wallet(privateKey, provider);
  const apiKit = new SafeApiKit({ chainId: BigInt(chainId) });

  const safeSDK = await Safe.init({
    provider: rpcUrl,
    signer: privateKey,
    safeAddress,
  });

  const safeTransaction: MetaTransactionData = {
    to,
    data,
    value: "0",
    operation: OperationType.Call,
  };

  const safeTx = await safeSDK.createTransaction({ transactions: [safeTransaction] });
  const safeTxHash = await safeSDK.getTransactionHash(safeTx);
  const senderSignature = await safeSDK.signHash(safeTxHash);

  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: wallet.address,
    senderSignature: senderSignature.data,
  });

  console.log(`✅ Proposed transaction to Safe on chain ${chainId} — Tx hash: ${safeTxHash}`);
}
