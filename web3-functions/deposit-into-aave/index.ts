import {
  Web3Function,
  Web3FunctionContext
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
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
  const { secrets, multiChainProvider } = context;

  const rpcUrl = await secrets.get('RPC_URL');
  const privateKey = await secrets.get('PRIVATE_KEY'); // EN EL .ENV QUE ESTA EN ESTA FOLDER PRIVATE KEY DEL PROPOSER/DELEGATE
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");

  if (!relayApiKey) {
    return {
      canExec: false,
      message: "🔑 Missing GELATO_RELAY_API_KEY"
    };
  }

  const encodedCalls: string[] = [];
  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  for (const [chainIdStr, addresses] of Object.entries(AAVE_ADDRESSES)) {
    const chainId = Number(chainIdStr);
    const { poolExposureSteward, dataProvider, priceOracle, collector } = addresses;

    const provider = multiChainProvider.chainId(chainId);
    const dataProviderContract = new Contract(dataProvider, AAVE_DATA_PROVIDER_ABI, provider);
    const priceOracleContract = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

    const reserves = await dataProviderContract.getAllReservesTokens();
    if (!reserves.length) continue;

    const tokens = reserves.map((r: { tokenAddress: string }) => r.tokenAddress);
 
    const prices = await priceOracleContract.getAssetsPrices(tokens);
    console.log("prices", prices);
    const configs = await Promise.all(tokens.map((token: string) => dataProviderContract.getReserveConfigurationData(token)));

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const price = prices[i];
      const { decimals, isActive, isFrozen } = configs[i];

      if (!isActive || isFrozen) continue;

      const erc20 = new Contract(token, ERC20_ABI, provider);
      const balance = await erc20.balanceOf(collector);
      const valueUsd = price
      .mul(balance)
      .div(ethers.BigNumber.from(10).pow(decimals)) 
      .div(ethers.BigNumber.from(10).pow(8));

      console.log("valueUsd", valueUsd.toString());

      if (valueUsd >= 100) {
        const depositData = stewardInterface.encodeFunctionData("depositV3", [poolExposureSteward, token, balance.toString()]);
        encodedCalls.push(depositData);
      }
    }
  }

  if (!encodedCalls.length) {
    return {
      canExec: false,
      message: "✅ No reserves exceed $100 at this time"
    };
  }

  const multicallData = stewardInterface.encodeFunctionData("multicall", [encodedCalls]);

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
    to: '0x55B16934C3661E1990939bC57322554d9B09f262',
    data: '0x',
    value: '0', 
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
    senderAddress: '0x0Fa7b2b8D25D27FC4c5C2B5802246D8900e28E0C', // JOAQUIN: ESTA ES LA DIRECCION DEL PROPOSER/DELEGATE
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
