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
  }
};

export const MAINNET_CHAIN_ID = 1;
// export const SAFE_ADDRESS = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
export const SAFE_ADDRESS = '0xCa5F4CBD4BF398c5a69e2a8005F6047Ab3F78BBf';
