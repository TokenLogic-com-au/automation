import {
  Web3Function,
  Web3FunctionContext
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { ethers } from "ethers";

import { GelatoRelayPack } from '@safe-global/relay-kit';
import Safe from '@safe-global/protocol-kit';
import EthersAdapter from '@safe-global/protocol-kit'
import { MetaTransactionData, MetaTransactionOptions, OperationType } from '@safe-global/types-kit';

import { STEWARD_ABI, AAVE_DATA_PROVIDER_ABI, AAVE_PRICE_ORACLE_ABI, ERC20_ABI } from "./abis";
import { AAVE_ADDRESSES, SAFE_ADDRESS, MAINNET_CHAIN_ID } from "./constants";

const getSignerAndAdapter = async (rpcUrl: string|undefined, privateKey: string|undefined) => {
  if (!rpcUrl) {
    return {
      canExec: false,
      message: "🔑 Missing RPC_URL"
    };
  }

  if (!privateKey || !privateKey.match(/^0x[a-fA-F0-9]{64}$/)) {
    return {
      canExec: false,
      message: "🔑 Missing PRIVATE_KEY"
    };
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer });

  return { signer, ethAdapter, provider };
}

const propose = async (): Promise<void> => {

}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider, secrets } = context;

  const rpcUrl = await secrets.get('RPC_URL');
  const privateKey = await secrets.get('PRIVATE_KEY');
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");

  const { signer, ethAdapter, provider } = await getSignerAndAdapter(rpcUrl, privateKey);

  if (!relayApiKey) {
    return {
      canExec: false,
      message: "🔑 Missing GELATO_RELAY_API_KEY"
    };
  }

  const safeSDK = await Safe.create({ ethAdapter, safeAddress: 'YOUR_SAFE_ADDRESS' });

  
  const encodedCalls: string[] = [];
  const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

  // for (const [chainIdStr, addresses] of Object.entries(AAVE_ADDRESSES)) {
  //   const chainId = Number(chainIdStr);
  //   const { poolExposureSteward, dataProvider, priceOracle, collector } = addresses;

  //   const provider = multiChainProvider.chainId(chainId);
  //   const dataProviderContract = new Contract(dataProvider, AAVE_DATA_PROVIDER_ABI, provider);
  //   const priceOracleContract = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  //   const reserves = await dataProviderContract.getAllReservesTokens();
  //   if (!reserves.length) continue;

  //   const tokens = reserves.map((r: { tokenAddress: string }) => r.tokenAddress);
  //   const prices = await priceOracleContract.getAssetsPrices(tokens);

  //   const configs = await Promise.all(tokens.map((token: string) => dataProviderContract.getReserveConfigurationData(token)));

  //   for (let i = 0; i < tokens.length; i++) {
  //     const token = tokens[i];
  //     const price = prices[i];
  //     const { decimals, isActive, isFrozen } = configs[i];

  //     if (!isActive || isFrozen) continue;

  //     const erc20 = new Contract(token, ERC20_ABI, provider);
  //     const balance = await erc20.balanceOf(collector);
  //     const valueUsd = price.mul(balance).div(ethers.BigNumber.from(10).pow(decimals));

  //     if (valueUsd.gte(ethers.utils.parseUnits("100", 18))) {
  //       const depositData = stewardInterface.encodeFunctionData("depositV3", [poolExposureSteward, token, balance.toString()]);
  //       encodedCalls.push(depositData);
  //     }
  //   }
  // }

  // if (!encodedCalls.length) {
  //   return {
  //     canExec: false,
  //     message: "✅ No reserves exceed $100 at this time"
  //   };
  // }

  // const multicallData = stewardInterface.encodeFunctionData("multicall", [encodedCalls]);

  const safeTransaction: MetaTransactionData = {
    to: '0x....', // <--------- PONER TU DIRECCION
    data: '0x', // Empty for ETH transfer
    value: '1', // 1 wei
    operation: OperationType.Call,
  };

  const safeTx = await safeSDK.createTransaction({ transactions: [safeTransaction] });
  const signedSafeTx = await safeSDK.signTransaction(safeTx);

  const relay = new GelatoRelay();

  const relayKit = new GelatoRelayPack({ apiKey: GELATO_API_KEY });

  const relayTransaction = {
    target: SAFE_ADDRESS,
    encodedTransaction: signedSafeTx.encodedSignatures(),
    chainId: BigInt(MAINNET_CHAIN_ID.toString()),
    options: { isSponsored: true }, // Gelato pays with balance
  };
  const response = await relayKit.relayTransaction(relayTransaction);

  // await relay.sponsoredCall({
  //   chainId: BigInt(MAINNET_CHAIN_ID.toString()),
  //   target: SAFE_ADDRESS,
  //   encodedTransaction: signedSafeTx.encodedSignatures(),
  // }, relayApiKey);

  return {
    canExec: false,
    message: `📝 Deposit transaction proposed to Safe (${SAFE_ADDRESS})`
  };
});
