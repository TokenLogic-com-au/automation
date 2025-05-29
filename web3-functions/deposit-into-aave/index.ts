import {
  Web3Function,
  Web3FunctionContext
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { ethers } from "ethers";

import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  OperationType
} from '@safe-global/types-kit'

import { STEWARD_ABI, AAVE_DATA_PROVIDER_ABI, AAVE_PRICE_ORACLE_ABI, ERC20_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS, MAINNET_CHAIN_ID } from "./constants";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { secrets } = context;

  const rpcUrl = await secrets.get('RPC_URL');
  const privateKey = await secrets.get('PRIVATE_KEY'); // EN EL .ENV QUE ESTA EN ESTA FOLDER PRIVATE KEY DEL PROPOSER/DELEGATE
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");

  if (!rpcUrl) {
    return {
      canExec: false,
      message: "🔑 Missing RPC_URL"
    };
  }

  if (!relayApiKey) {
    return {
      canExec: false,
      message: "🔑 Missing GELATO_RELAY_API_KEY"
    };
  }

  const safeSDK = await Safe.init({ provider: rpcUrl, signer: privateKey, safeAddress: SAFE_ADDRESS });
  const safeTransaction: MetaTransactionData = {
    to: '0x55B16934C3661E1990939bC57322554d9B09f262', // CUALQUIERA, NO IMPORTA
    data: '0x',
    value: '1', // 1 wei
    operation: OperationType.Call,
  };

  const safeTx = await safeSDK.createTransaction({ transactions: [safeTransaction] });
  const apiKit = new SafeApiKit({
    chainId: 1n
  });
  const safeTxHash = await safeSDK.getTransactionHash(safeTx);
  const senderSignature = await safeSDK.signHash(safeTxHash);


  await apiKit.proposeTransaction({
    safeAddress: SAFE_ADDRESS, // JOAQUIN: ESTA ES LA NUEVA SAFE QUE ACABAS DE CREAR
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: '0x92B5e008253c9Fe3C0a9870eac031473B913421f', // JOAQUIN: ESTA ES LA DIRECCION DEL PROPOSER/DELEGATE
    senderSignature: senderSignature.data
  });

  return {
    canExec: false,
    message: `📝 Deposit transaction proposed to Safe (${SAFE_ADDRESS})`
  };
});


// TODO:
// 1. CREATE NEW SAFE WITH 1 OWNER
// 2. ASSIGN ANOTHER ADDRESS AS A PROPOSER/DELEGATE (INTERCHANGEABLE TERM)
// 3. EDIT VALUES ON THIS FILE
// 4. EXECUTE THIS SCRIPT
