type AaveAddress = {
  poolExposureSteward: string;
  dataProvider: string;
  priceOracle: string;
  collector: string;
};

export const AAVE_ADDRESSES: Record<number, AaveAddress> = {
  1: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
  137: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0xe8599F3cc5D38a9aD6F3684cd5CEa72f10Dbc383",
    priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1",
  },
  42161: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0x053D55f9B5AF8694c503EB288a1B7E552f590710",
    priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
  },
  10: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x14496b405D62c24F91f04Cda1c69Dc526D56fDE5",
    collector: "0xB2289E329D2F85F1eD31Adbb30eA345278F21bcf",
    priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
  },
  8453: {
    poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
    dataProvider: "0x78dc7c9e64a4a6b22615f4FCf0E824906f8a06d9",
    collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
  }
};

export const SAFE_ADDRESS = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
