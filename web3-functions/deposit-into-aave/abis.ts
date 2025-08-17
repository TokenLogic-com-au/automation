const STEWARD_ABI = [
  {
    inputs: [{ internalType: "address", name: "poolV2", type: "address" }],
    name: "approvedV2Pools",
    outputs: [{ internalType: "bool", name: "approved", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "poolV3", type: "address" }],
    name: "approvedV3Pools",
    outputs: [{ internalType: "bool", name: "approved", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "reserve", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "depositV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "fromPool", type: "address" },
      { internalType: "address", name: "toPool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "migrateBetweenV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "v2Pool", type: "address" },
      { internalType: "address", name: "v3Pool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "migrateV2toV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "rescueToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "underlying", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawV2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "pool", type: "address" },
      { internalType: "address", name: "reserve", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawV3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const AAVE_DATA_PROVIDER_V3_ABI = [
  {
    name: "getAllReservesTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IPoolDataProvider.TokenData[]",
        components: [
          { name: "symbol", type: "string", internalType: "string" },
          { name: "tokenAddress", type: "address", internalType: "address" },
        ],
      },
    ],
  },
  {
    name: "getReserveConfigurationData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address", internalType: "address" }],
    outputs: [
      { name: "decimals", type: "uint256", internalType: "uint256" },
      { name: "ltv", type: "uint256", internalType: "uint256" },
      {
        name: "liquidationThreshold",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "liquidationBonus",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "reserveFactor", type: "uint256", internalType: "uint256" },
      {
        name: "usageAsCollateralEnabled",
        type: "bool",
        internalType: "bool",
      },
      { name: "borrowingEnabled", type: "bool", internalType: "bool" },
      {
        name: "stableBorrowRateEnabled",
        type: "bool",
        internalType: "bool",
      },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "isFrozen", type: "bool", internalType: "bool" },
    ],
  },
  {
    name: "getReserveCaps",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address", internalType: "address" }],
    outputs: [
      { name: "borrowCap", type: "uint256", internalType: "uint256" },
      { name: "supplyCap", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    name: "getReserveTokensAddresses",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "aTokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "stableDebtTokenAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "variableDebtTokenAddress",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    name: "getReserveData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address", internalType: "address" }],
    outputs: [
      { name: "unbacked", type: "uint256", internalType: "uint256" },
      {
        name: "accruedToTreasuryScaled",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "totalAToken", type: "uint256", internalType: "uint256" },
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "totalVariableDebt", type: "uint256", internalType: "uint256" },
      { name: "liquidityRate", type: "uint256", internalType: "uint256" },
      { name: "variableBorrowRate", type: "uint256", internalType: "uint256" },
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "liquidityIndex", type: "uint256", internalType: "uint256" },
      { name: "variableBorrowIndex", type: "uint256", internalType: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40", internalType: "uint40" },
    ],
  },
];

const AAVE_DATA_PROVIDER_V2_ABI = [
  {
    inputs: [
      {
        internalType: "contract ILendingPoolAddressesProvider",
        name: "addressesProvider",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ADDRESSES_PROVIDER",
    outputs: [
      {
        internalType: "contract ILendingPoolAddressesProvider",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllATokens",
    outputs: [
      {
        components: [
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "address", name: "tokenAddress", type: "address" },
        ],
        internalType: "struct AaveProtocolDataProvider.TokenData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllReservesTokens",
    outputs: [
      {
        components: [
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "address", name: "tokenAddress", type: "address" },
        ],
        internalType: "struct AaveProtocolDataProvider.TokenData[]",
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
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      { internalType: "uint256", name: "availableLiquidity", type: "uint256" },
      { internalType: "uint256", name: "totalStableDebt", type: "uint256" },
      { internalType: "uint256", name: "totalVariableDebt", type: "uint256" },
      { internalType: "uint256", name: "liquidityRate", type: "uint256" },
      { internalType: "uint256", name: "variableBorrowRate", type: "uint256" },
      { internalType: "uint256", name: "stableBorrowRate", type: "uint256" },
      {
        internalType: "uint256",
        name: "averageStableBorrowRate",
        type: "uint256",
      },
      { internalType: "uint256", name: "liquidityIndex", type: "uint256" },
      { internalType: "uint256", name: "variableBorrowIndex", type: "uint256" },
      { internalType: "uint40", name: "lastUpdateTimestamp", type: "uint40" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getReserveTokensAddresses",
    outputs: [
      { internalType: "address", name: "aTokenAddress", type: "address" },
      {
        internalType: "address",
        name: "stableDebtTokenAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "variableDebtTokenAddress",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "getUserReserveData",
    outputs: [
      {
        internalType: "uint256",
        name: "currentATokenBalance",
        type: "uint256",
      },
      { internalType: "uint256", name: "currentStableDebt", type: "uint256" },
      { internalType: "uint256", name: "currentVariableDebt", type: "uint256" },
      { internalType: "uint256", name: "principalStableDebt", type: "uint256" },
      { internalType: "uint256", name: "scaledVariableDebt", type: "uint256" },
      { internalType: "uint256", name: "stableBorrowRate", type: "uint256" },
      { internalType: "uint256", name: "liquidityRate", type: "uint256" },
      { internalType: "uint40", name: "stableRateLastUpdated", type: "uint40" },
      { internalType: "bool", name: "usageAsCollateralEnabled", type: "bool" },
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
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const ROLES_MODIFIER_ABI = [
  "function execTransactionWithRole(address,uint256,bytes,uint8,bytes32,bool)",
];

export {
  STEWARD_ABI,
  AAVE_DATA_PROVIDER_V3_ABI,
  AAVE_DATA_PROVIDER_V2_ABI,
  AAVE_PRICE_ORACLE_ABI,
  ERC20_ABI,
  ROLES_MODIFIER_ABI,
};
