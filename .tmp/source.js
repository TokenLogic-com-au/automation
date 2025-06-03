// web3-functions/deposit-into-aave/index.ts
import { Web3Function } from "@gelatonetwork/web3-functions-sdk";
import { ethers as ethers4 } from "ethers";

// web3-functions/deposit-into-aave/helpers/chainCalls.ts
import { Contract } from "@ethersproject/contracts";
import { ethers as ethers2 } from "ethers";

// web3-functions/deposit-into-aave/abis.ts
var STEWARD_ABI = [
  {
    inputs: [{ internalType: "address", name: "poolV2", type: "address" }],
    name: "approvedV2Pools",
    outputs: [{ internalType: "bool", name: "approved", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "poolV3", type: "address" }],
    name: "approvedV3Pools",
    outputs: [{ internalType: "bool", name: "approved", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "reserve", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "depositV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "fromPool", type: "address" },
      { internalType: "address", name: "toPool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "migrateBetweenV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "v2Pool", type: "address" },
      { internalType: "address", name: "v3Pool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "migrateV2toV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "rescueToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawV2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "reserve", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];
var AAVE_DATA_PROVIDER_ABI = [
  {
    inputs: [],
    name: "getAllReservesTokens",
    outputs: [
      {
        components: [
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "address", name: "tokenAddress", type: "address" }
        ],
        internalType: "struct IPoolDataProvider.TokenData[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getReserveConfigurationData",
    outputs: [
      { internalType: "uint256", name: "decimals", type: "uint256" },
      { internalType: "uint256", name: "ltv", type: "uint256" },
      {
        internalType: "uint256",
        name: "liquidationThreshold",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "liquidationBonus",
        type: "uint256"
      },
      { internalType: "uint256", name: "reserveFactor", type: "uint256" },
      {
        internalType: "bool",
        name: "usageAsCollateralEnabled",
        type: "bool"
      },
      { internalType: "bool", name: "borrowingEnabled", type: "bool" },
      {
        internalType: "bool",
        name: "stableBorrowRateEnabled",
        type: "bool"
      },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "isFrozen", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
];
var AAVE_PRICE_ORACLE_ABI = [
  {
    inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
    name: "getAssetsPrices",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  }
];
var ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// web3-functions/deposit-into-aave/helpers/value.ts
import { ethers } from "ethers";
var PRICE_DECIMALS = 8;
var calculateUsdValue = (balance, price, decimals) => {
  return price.mul(balance).div(ethers.BigNumber.from(10).pow(decimals)).div(ethers.BigNumber.from(10).pow(PRICE_DECIMALS));
};

// web3-functions/deposit-into-aave/helpers/chainCalls.ts
var MIN_USD_THRESHOLD = ethers2.BigNumber.from(1e3);
async function buildEncodedCalls(provider, addresses, stewardInterface) {
  const { dataProvider, priceOracle, collector, poolExposureSteward } = addresses;
  const dataProviderContract = new Contract(dataProvider, AAVE_DATA_PROVIDER_ABI, provider);
  const priceOracleContract = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);
  const reserves = await dataProviderContract.getAllReservesTokens();
  if (!reserves.length)
    return [];
  const tokens = reserves.map((r) => r.tokenAddress);
  const prices = await priceOracleContract.getAssetsPrices(tokens);
  const configs = await Promise.all(
    tokens.map((token) => dataProviderContract.getReserveConfigurationData(token))
  );
  const encodedCalls = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const price = prices[i];
    const { decimals, isActive, isFrozen } = configs[i];
    if (!isActive || isFrozen)
      continue;
    const erc20 = new Contract(token, ERC20_ABI, provider);
    const balance = await erc20.balanceOf(collector);
    const valueUsd = calculateUsdValue(balance, price, decimals);
    if (valueUsd.gte(MIN_USD_THRESHOLD)) {
      const depositData = stewardInterface.encodeFunctionData("depositV3", [
        poolExposureSteward,
        token,
        balance.toString()
      ]);
      encodedCalls.push(depositData);
    }
  }
  return encodedCalls;
}

// web3-functions/deposit-into-aave/helpers/safe.ts
import { ethers as ethers3 } from "ethers";
import { OperationType } from "@safe-global/types-kit";
import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";
async function proposeSafeMulticall(chainId, provider, rpcUrl, privateKey, safeAddress, to, data) {
  const wallet = new ethers3.Wallet(privateKey, provider);
  const apiKit = new SafeApiKit({ chainId: BigInt(chainId) });
  const safeSDK = await Safe.init({
    provider: rpcUrl,
    signer: privateKey,
    safeAddress
  });
  const safeTransaction = {
    to,
    data,
    value: "0",
    operation: OperationType.Call
  };
  const safeTx = await safeSDK.createTransaction({ transactions: [safeTransaction] });
  const safeTxHash = await safeSDK.getTransactionHash(safeTx);
  const senderSignature = await safeSDK.signHash(safeTxHash);
  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: wallet.address,
    senderSignature: senderSignature.data
  });
  console.log(`\u2705 Proposed transaction to Safe on chain ${chainId} \u2014 Tx hash: ${safeTxHash}`);
}

// web3-functions/deposit-into-aave/constants.ts
var AAVE_ADDRESSES = {
  1: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2"
  },
  137: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0xe8599F3cc5D38a9aD6F3684cd5CEa72f10Dbc383",
    priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1"
  }
  // 42161: {
  //   poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
  //   dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
  //   collector: "0x053D55f9B5AF8694c503EB288a1B7E552f590710",
  //   priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
  // },
  // 10: {
  //   poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
  //   dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
  //   collector: "0xB2289E329D2F85F1eD31Adbb30eA345278F21bcf",
  //   priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
  // },
  // 8453: {
  //   poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
  //   dataProvider: "0xC4Fcf9893072d61Cc2899C0054877Cb752587981",
  //   collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
  //   priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
  // }
};
var SAFE_ADDRESS = "0x2CddF8c22dAFd25559f3301c1dD46F4964C666E6";

// web3-functions/deposit-into-aave/index.ts
Web3Function.onRun(async (context) => {
  const { secrets } = context;
  const privateKey = await secrets.get("PRIVATE_KEY");
  const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");
  const sharedSafeAddress = SAFE_ADDRESS;
  const getNetworkKey = (chainId) => ({
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    8453: "BASE"
  })[chainId] || "";
  if (!relayApiKey || !privateKey || !sharedSafeAddress) {
    return {
      canExec: false,
      message: "\u{1F511} Missing required secrets (GELATO_RELAY_API_KEY, PRIVATE_KEY, SAFE_ADDRESS)"
    };
  }
  const stewardInterface = new ethers4.utils.Interface(STEWARD_ABI);
  const results = await Promise.allSettled(
    Object.entries(AAVE_ADDRESSES).map(async ([chainIdStr, addresses]) => {
      const chainId = Number(chainIdStr);
      const networkKey = getNetworkKey(chainId);
      const rpcUrl = await secrets.get(`RPC_URL_${networkKey}`) || "";
      if (!rpcUrl) {
        console.warn(`\u26A0\uFE0F Skipping chain ${chainId}: missing RPC URL`);
        return;
      }
      try {
        const provider = new ethers4.providers.JsonRpcProvider(rpcUrl);
        const encodedCalls = await buildEncodedCalls(provider, addresses, stewardInterface);
        if (!encodedCalls.length) {
          console.log(`\u2139\uFE0F No encoded calls for chain ${chainId}`);
          return;
        }
        const multicallData = stewardInterface.encodeFunctionData("multicall", [encodedCalls]);
        await proposeSafeMulticall(
          chainId,
          provider,
          rpcUrl,
          privateKey,
          sharedSafeAddress,
          "0x0Fa7b2b8D25D27FC4c5C2B5802246D8900e28E0C",
          "0x"
        );
        console.log(`\u2705 Proposed transaction to Safe on chain ${chainId}`);
      } catch (error) {
        console.error(`\u274C Error processing chain ${chainId}:`, error);
      }
    })
  );
  const successes = results.filter((r) => r.status === "fulfilled").length;
  const failures = results.filter((r) => r.status === "rejected").length;
  return {
    canExec: false,
    message: `\u{1F4DD} Multichain proposals finished \u2014 \u2705 ${successes}, \u274C ${failures}`
  };
});
