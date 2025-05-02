import {
    Web3Function,
    Web3FunctionContext,
  } from "@gelatonetwork/web3-functions-sdk";
  import { Contract } from "@ethersproject/contracts";
  import { GelatoRelay } from "@gelatonetwork/relay-sdk";
  import Safe from "@safe-global/protocol-kit";
import { GelatoRelayPack, MetaTransactionData, MetaTransactionOptions } from "@safe-global/relay-kit";
import { ethers } from "ethers";

 const STEWARD_ABI = [
    {
      inputs: [
        { internalType: "address", name: "initialOwner", type: "address" },
        { internalType: "address", name: "initialGuardian", type: "address" },
        { internalType: "address", name: "collector", type: "address" },
        { internalType: "address[]", name: "poolsV2", type: "address[]" },
        { internalType: "address[]", name: "poolsV3", type: "address[]" }
      ],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    { inputs: [{ internalType: "address", name: "target", type: "address" }], name: "AddressEmptyCode", type: "error" },
    { inputs: [], name: "EthTransferFailed", type: "error" },
    { inputs: [], name: "FailedCall", type: "error" },
    { inputs: [], name: "InvalidZeroAddress", type: "error" },
    { inputs: [], name: "InvalidZeroAmount", type: "error" },
    { inputs: [], name: "MismatchingArrayLength", type: "error" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OnlyGuardianInvalidCaller", type: "error" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OnlyGuardianOrOwnerInvalidCaller", type: "error" },
    { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "OwnableInvalidOwner", type: "error" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OwnableUnauthorizedAccount", type: "error" },
    { inputs: [{ internalType: "address", name: "token", type: "address" }], name: "SafeERC20FailedOperation", type: "error" },
    { inputs: [], name: "UnrecognizedPool", type: "error" },
  
    { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "pool", type: "address" }], name: "ApprovedV2Pool", type: "event" },
    { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "pool", type: "address" }], name: "ApprovedV3Pool", type: "event" },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "caller", type: "address" },
        { indexed: true, internalType: "address", name: "token", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
      ],
      name: "ERC20Rescued",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: "address", name: "oldGuardian", type: "address" },
        { indexed: false, internalType: "address", name: "newGuardian", type: "address" }
      ],
      name: "GuardianUpdated",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "caller", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
      ],
      name: "NativeTokensRescued",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
        { indexed: true, internalType: "address", name: "newOwner", type: "address" }
      ],
      name: "OwnershipTransferred",
      type: "event"
    },
    { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "pool", type: "address" }], name: "RevokedV2Pool", type: "event" },
    { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "pool", type: "address" }], name: "RevokedV3Pool", type: "event" },
  
    { inputs: [], name: "COLLECTOR", outputs: [{ internalType: "contract ICollector", name: "", type: "address" }], stateMutability: "view", type: "function" },
    {
      inputs: [
        { internalType: "address", name: "newPool", type: "address" },
        { internalType: "bool", name: "isVersion3", type: "bool" }
      ],
      name: "approvePool",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
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
    { inputs: [], name: "guardian", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "maxRescue",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
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
    { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
    { inputs: [], name: "rescueEth", outputs: [], stateMutability: "nonpayable", type: "function" },
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
        { internalType: "bool", name: "isVersion3", type: "bool" }
      ],
      name: "revokePool",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [{ internalType: "address", name: "newGuardian", type: "address" }],
      name: "updateGuardian",
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
 const AAVE_DATA_PROVIDER_ABI = [
    {
     inputs: [],
      name: "getAllReservesTokens",
      outputs: [
        {
          components: [
            { internalType: "string", name: "symbol", type: "string" },
            { internalType: "address", name: "tokenAddress", type: "address" },
          ],
          internalType: "struct IPoolDataProvider.TokenData[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
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
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "liquidationBonus",
          type: "uint256",
        },
        { internalType: "uint256", name: "reserveFactor", type: "uint256" },
        {
          internalType: "bool",
          name: "usageAsCollateralEnabled",
          type: "bool",
        },
        { internalType: "bool", name: "borrowingEnabled", type: "bool" },
        {
          internalType: "bool",
          name: "stableBorrowRateEnabled",
          type: "bool",
        },
        { internalType: "bool", name: "isActive", type: "bool" },
        { internalType: "bool", name: "isFrozen", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];
 const AAVE_PRICE_ORACLE_ABI = [
    {
      inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
      name: "getAssetsPrices",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const relay = new GelatoRelay();

  type AaveAddress = {
    poolExposureSteward: string;
    dataProvider: string;
    priceOracle: string;
    collector: string;
  };

  const AAVE_ADDRESSES: Record<number, AaveAddress> = {
    1: {
        poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
        dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
        collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
        priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    }
};

const SAFE_ADDRESS = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
const SAFE_CHAIN_ID = 1; 

  Web3Function.onRun(async (context: Web3FunctionContext) => {
    const { multiChainProvider, secrets } = context;

    const relayApiKey = await secrets.get("GELATO_RELAY_API_KEY");
    const safeOwnerKey = await secrets.get("SAFE_OWNER_PRIVATE_KEY");
    if (!relayApiKey || !safeOwnerKey) {
      return {
        canExec: false,
        message:
          "🔑 Please configure both GELATO_RELAY_API_KEY and SAFE_OWNER_PRIVATE_KEY in your Web3Function secrets"
      };
    }

    const encodedCalls: string[] = [];

    for (const chainId of Object.keys(AAVE_ADDRESSES).map((c) => +c)) {
      const {
        poolExposureSteward,
        dataProvider,
        priceOracle,
        collector
      } = AAVE_ADDRESSES[chainId];
  
      const provider = multiChainProvider.get(chainId)!;
      const dataProviderContract = new Contract(
        dataProvider,
        AAVE_DATA_PROVIDER_ABI,
        provider
      );
      const priceOracleContract = new Contract(
        priceOracle,
        AAVE_PRICE_ORACLE_ABI,
        provider
      );
      const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

      const reserves: { symbol: string; tokenAddress: string }[] =
      await dataProviderContract.getAllReservesTokens();
    if (reserves.length === 0) continue;

    const tokens = reserves.map((r) => r.tokenAddress);

    const prices: ethers.BigNumber[] =
    await priceOracleContract.getAssetsPrices(tokens);

    const configCalls = reserves.map((r) =>
      dataProviderContract.getReserveConfigurationData(r.tokenAddress)
    );
    const configs = await Promise.all(configCalls);

    // for each token, check collector balance & USD value
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const price = prices[i]; // in wei = USD * 1e18
      const { decimals } = configs[i]; // token decimals

      const erc20 = new Contract(token, ERC20_ABI, provider);
      const balance: ethers.BigNumber = await erc20.balanceOf(collector);

      // compute USD value: price * balance / (10**decimals)
      const valueUsd = price.mul(balance).div(
        ethers.BigNumber.from(10).pow(decimals)
      );

      // threshold $100 = 100 * 1e18
      if (valueUsd.gte(ethers.parseUnits("100", 18))) {
        const depositData = stewardInterface.encodeFunctionData("depositV3", [
          poolExposureSteward,
          token,
          balance.toString()
        ]);
        encodedCalls.push(depositData);
      }
    }
  }

  if (encodedCalls.length === 0) {
    return {
      canExec: false,
      message: "✅ No reserves exceed $100 at this time"
    };
  }

  const stewardIface = new ethers.utils.Interface(STEWARD_ABI);
  const multicallData = stewardIface.encodeFunctionData("multicall", [
    encodedCalls
  ]);

  const safeChainProvider = multiChainProvider.get(SAFE_CHAIN_ID)!;

  const protocolKit = await Safe.init({
    provider: safeChainProvider,
    signer: safeOwnerKey,
    safeAddress: SAFE_ADDRESS
  });
  const relayKit = new GelatoRelayPack({
    apiKey: relayApiKey,
    protocolKit
  });

  const tx: MetaTransactionData = {
    to: AAVE_ADDRESSES[SAFE_CHAIN_ID].poolExposureSteward,
    data: multicallData,
    value: "0"
  };
  const options: MetaTransactionOptions = { isSponsored: true };

  const safeTx = await relayKit.createTransaction({
    transactions: [tx],
    options
  });
  const signed = await protocolKit.signTransaction(safeTx);
  const { taskId } = await relayKit.executeTransaction({
    executable: signed,
    options
  });

  return {
    canExec: false,
    message: `🚀 Proposal submitted to Safe (${SAFE_ADDRESS}) — Gelato Task ID: ${taskId}`
  };

  });

