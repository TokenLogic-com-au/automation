import { BigNumber } from "ethers";

export enum Network {
  Mainnet = 1,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  BSC = 56,
  Optimism = 10,
  Polygon = 137,
  PolygonZkEvm = 1101,
  Scroll = 534352,
  ZkSync = 324,
  Metis = 1088,
  Linea = 59144,
}

export type AaveContractAddresses = {
  feeClaimer: string;
  dataProvider: string;
  priceOracle: string;
};

export type TokenData = {
  symbol: string;
  tokenAddress: string;
};

export type ReserveConfigurationData = {
  decimals: BigNumber;
};

export const AAVE_ADDRESSES: Record<number, AaveContractAddresses> = {
  [Network.Mainnet]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
  [Network.Arbitrum]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
  },
  [Network.Avalanche]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C",
  },
  [Network.Base]: {
    feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
    dataProvider: "0xd82a47fdebB5bf5329b09441C3DaB4b5df2153Ad",
    priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
  },
  [Network.BSC]: {
    feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
    dataProvider: "0x23dF2a19384231aFD114b036C14b6b03324D79BC",
    priceOracle: "0x39bc1bfDa2130d6Bb6DBEfd366939b4c7aa7C697",
  },
  [Network.Optimism]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
  },
  [Network.Polygon]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1",
  },
  [Network.PolygonZkEvm]: {
    feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
    dataProvider: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
    priceOracle: "0x3e652E97ff339B73421f824F5b03d75b62F1Fb51",
  },
  [Network.Scroll]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
  [Network.ZkSync]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
  [Network.Metis]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
  [Network.Linea]: {
    feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
    dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
    priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
  },
};
