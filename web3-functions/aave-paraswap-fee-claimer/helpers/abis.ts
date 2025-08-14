export const AAVE_PARASWAP_FEE_CLAIMER_ABI = [
  {
    inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
    name: "batchClaimToCollector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
    name: "batchGetClaimable",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

export const AAVE_DATA_PROVIDER_ABI = [
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
      { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
      { internalType: "uint256", name: "reserveFactor", type: "uint256" },
      { internalType: "bool", name: "usageAsCollateralEnabled", type: "bool" },
      { internalType: "bool", name: "borrowingEnabled", type: "bool" },
      { internalType: "bool", name: "stableBorrowRateEnabled", type: "bool" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "isFrozen", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const AAVE_PRICE_ORACLE_ABI = [
  {
    inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
    name: "getAssetsPrices",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];
