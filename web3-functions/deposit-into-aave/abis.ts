const STEWARD_ABI = [
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

const AAVE_DATA_PROVIDER_ABI = [
  {
    inputs: [] as { internalType: string; name: string; type: string }[],
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

const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export { STEWARD_ABI, AAVE_DATA_PROVIDER_ABI, AAVE_PRICE_ORACLE_ABI, ERC20_ABI };
