type AaveAddress = {
  poolExposureSteward: string;
  dataProvider: string;
  collector: string;
  priceOracle: string;
  corePool: string;
  primePool?: string;
};

export const AAVE_ADDRESSES: Record<number, AaveAddress> = {
  1: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    corePool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",   
    primePool: "0x4e033931ad43597d96D6bcc25c280717730B58B1"
  },
  137: {
    poolExposureSteward: "0xE5b11ab4D36E58C9171e3DB98Ba17336606Cd6ef",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0xe8599F3cc5D38a9aD6F3684cd5CEa72f10Dbc383",
    priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1",
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  },
  42161: {
    poolExposureSteward: "0xfB1D12D7C9c3Eb6b40fe0502801CdFCE816a0d18",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0x053D55f9B5AF8694c503EB288a1B7E552f590710",
    priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  },
  10: {
    poolExposureSteward: "0x4684b645386525057526EB85854045914Fe389d6",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0xB2289E329D2F85F1eD31Adbb30eA345278F21bcf",
    priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
    corePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  },
  8453: {
    poolExposureSteward: "0x4f1F3E32f20847a4c9F002882eB607aD750b6115",
    dataProvider: "0xC4Fcf9893072d61Cc2899C0054877Cb752587981",
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
    corePool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"
  }
};

export const SAFE_ADDRESS = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";

export const ROLE_KEY = '0x616176655f6465706f7369746f72000000000000000000000000000000000000';
