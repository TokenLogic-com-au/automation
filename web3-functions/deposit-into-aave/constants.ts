type AaveAddress = {
  poolExposureSteward: string;
  dataProviderV3: string;
  collector: string;
  priceOracle: string;
  corePool: string;
  primePool?: string;
  v2Pool?: string;
  dataProviderV2?: string;
};

export const AAVE_ADDRESSES: Record<number, AaveAddress> = {
  1: {
    // https://etherscan.io/address/0x22aC12a6937BBBC0a301AF9154d08EaD95673122
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    // https://etherscan.io/address/0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6
    dataProviderV3: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
    // https://etherscan.io/address/0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d
    dataProviderV2: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d",
    // https://etherscan.io/address/0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    // https://etherscan.io/address/0x54586bE62E3c3580375aE3723C145253060Ca0C2
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    // https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
    corePool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",   
    // https://etherscan.io/address/0x4e033931ad43597d96D6bcc25c280717730B58B1
    primePool: "0x4e033931ad43597d96D6bcc25c280717730B58B1",
    // https://etherscan.io/address/0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9
    v2Pool: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"
  },
  137: {
    // https://polygonscan.com/address/0xE5b11ab4D36E58C9171e3DB98Ba17336606Cd6ef
    poolExposureSteward: "0xE5b11ab4D36E58C9171e3DB98Ba17336606Cd6ef",
    // https://polygonscan.com/address/0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5
    dataProviderV3: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    // https://polygonscan.com/address/0x7551b5D2763519d4e37e8B81929D336De671d46d
    dataProviderV2: "0x7551b5D2763519d4e37e8B81929D336De671d46d",
    // https://polygonscan.com/address/0xe8599F3cc5D38a9aD6F3684cd5CEa72f10Dbc383
    collector: "0xe8599F3cc5D38a9aD6F3684cd5CEa72f10Dbc383",
    // https://polygonscan.com/address/0xb023e699F5a33916Ea823A16485e259257cA8Bd1
    priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1",
    // https://polygonscan.com/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // https://polygonscan.com/address/0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf
    v2Pool: "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf"
  },
  42161: {
    // https://arbiscan.io/address/0xfB1D12D7C9c3Eb6b40fe0502801CdFCE816a0d18
    poolExposureSteward: "0xfB1D12D7C9c3Eb6b40fe0502801CdFCE816a0d18",
    // https://arbiscan.io/address/0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5
    dataProviderV3: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    // https://arbiscan.io/address/0x053D55f9B5AF8694c503EB288a1B7E552f590710
    collector: "0x053D55f9B5AF8694c503EB288a1B7E552f590710",
    // https://arbiscan.io/address/0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7
    priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
    // https://arbiscan.io/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  },
  10: {
    // https://optimistic.etherscan.io/address/0x4684b645386525057526EB85854045914Fe389d6#code
    poolExposureSteward: "0x4684b645386525057526EB85854045914Fe389d6",
    // https://optimistic.etherscan.io/address/0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5#code
    dataProviderV3: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    // https://optimistic.etherscan.io/address/0xB2289E329D2F85F1eD31Adbb30eA345278F21bcf#code
    collector: "0xB2289E329D2F85F1eD31Adbb30eA345278F21bcf",
    // https://optimistic.etherscan.io/address/0xD81eb3728a631871a7eBBaD631b5f424909f0c77#code
    priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
    // https://optimistic.etherscan.io/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD#code
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  },
  8453: {
    // https://basescan.org/address/0x4f1F3E32f20847a4c9F002882eB607aD750b6115
    poolExposureSteward: "0x4f1F3E32f20847a4c9F002882eB607aD750b6115",
    // https://basescan.org/address/0xC4Fcf9893072d61Cc2899C0054877Cb752587981
    dataProviderV3: "0xC4Fcf9893072d61Cc2899C0054877Cb752587981",
    // https://basescan.org/address/0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    // https://basescan.org/address/0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156
    priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
    // https://basescan.org/address/0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
    corePool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"
  },
  43114: {
    // https://snowtrace.io/address/0x0d68D50DB848dfE6012456781c1D79A11eD12a2e
    poolExposureSteward: "0x0d68D50DB848dfE6012456781c1D79A11eD12a2e",
    // https://snowtrace.io/address/0x243Aa95cAC2a25651eda86e80bEe66114413c43b
    dataProviderV3: "0x243Aa95cAC2a25651eda86e80bEe66114413c43b",
    // https://snowtrace.io/address/0x65285E9dfab318f57051ab2b139ccCf232945451
    dataProviderV2: "0x65285E9dfab318f57051ab2b139ccCf232945451",
    // https://snowtrace.io/address/0x5ba7fd868c40c16f7aDfAe6CF87121E13FC2F7a0
    collector: "0x5ba7fd868c40c16f7aDfAe6CF87121E13FC2F7a0",
    // https://snowtrace.io/address/0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C
    priceOracle: "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C",
    // https://snowtrace.io/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // https://snowtrace.io/address/0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C
    v2Pool: "0x4F01AeD16D97E3aB5ab2B501154DC9bb0F1A5A2C"
  }
};

// https://etherscan.io/address/0x22740deBa78d5a0c24C58C740e3715ec29de1bFa
export const SAFE_ADDRESS = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";

export const ROLE_KEY = '0x616176655f6465706f7369746f72000000000000000000000000000000000000';

// https://etherscan.io/address/0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f
export const GHO = "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f".toLowerCase();    
// https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".toLowerCase();     
// https://etherscan.io/address/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0
export const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0".toLowerCase();   
// https://etherscan.io/address/0x6b175474e89094c44da98b954eedeac495271d0f
export const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase(); 

export const IGNORED_TOKENS = new Set([GHO]);

export const PRIME_MAINNET_TOKENS = new Set([WETH, WSTETH]);
