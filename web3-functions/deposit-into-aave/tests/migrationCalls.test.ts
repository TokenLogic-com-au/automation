import { buildMigrationCalls } from "../helpers/migrationCalls";

import { Contract } from "@ethersproject/contracts";
import { ethers, BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn(),
}));

jest.mock("../helpers/value", () => ({
  __esModule: true,
  calculateUsdValue: jest.fn(() => BigNumber.from("20000")),
}));

const mockGetAssetsPrices = jest.fn();
const mockGetReserveCaps = jest.fn();
const mockGetReserveTokensAddresses = jest.fn();
const mockGetReserveData = jest.fn();
const mockTotalSupply = jest.fn();
const mockBalanceOf = jest.fn();
const mockGetAllReservesTokens = jest.fn();

const ContractMock = Contract as unknown as jest.Mock;
ContractMock.mockImplementation(() => ({
  getAllReservesTokens: mockGetAllReservesTokens,
  getAssetsPrices: mockGetAssetsPrices,
  getReserveCaps: mockGetReserveCaps,
  getReserveTokensAddresses: mockGetReserveTokensAddresses,
  getReserveData: mockGetReserveData,
  totalSupply: mockTotalSupply,
  balanceOf: mockBalanceOf,
}));

const fakeSteward = { encodeFunctionData: jest.fn(() => "0xEncodedCall") };

const baseAddresses = {
  v2Pool: "0xV2Pool",
  dataProviderV2: "0xDataProviderV2",
  dataProviderV3: "0xDataProviderV3",
  priceOracle: "0xOracle",
  collector: "0xCollector",
  corePool: "0xCore",
  primePool: "0xPrime",
};

function setHappyPathMocks(token: string) {
  mockGetAllReservesTokens.mockReturnValueOnce([{ tokenAddress: token }]);
  mockGetAssetsPrices.mockReturnValueOnce([BigNumber.from("1000")]);
  mockGetReserveCaps.mockReturnValueOnce([
    BigNumber.from("0"), // borrowCap
    BigNumber.from("1000000000000000000000000"), // supplyCap
  ]);
  mockGetReserveTokensAddresses.mockReturnValue({ aTokenAddress: "0xATokenV2" });
  mockGetReserveData.mockReturnValue({ availableLiquidity: parseUnits("5", 18) });
  mockBalanceOf.mockReturnValue(parseUnits("3", 18));
  mockTotalSupply.mockReturnValue(BigNumber.from("0"));
}

describe("buildMigrationCalls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an encoded call when all conditions are met", async () => {
    setHappyPathMocks("0xTokenHappyPathMainnet");

    const calls = await buildMigrationCalls(
      {} as ethers.providers.Provider,
      baseAddresses as any,
      fakeSteward as any,
      1,
    );

    expect(calls).toEqual(["0xEncodedCall"]);
    expect(fakeSteward.encodeFunctionData).toHaveBeenCalledTimes(1);
  });

  it("skips asset when balance is zero", async () => {
    setHappyPathMocks("0xTokenZeroBalance");
    mockBalanceOf.mockReturnValueOnce(BigNumber.from("0"));

    const calls = await buildMigrationCalls(
      {} as ethers.providers.Provider,
      baseAddresses as any,
      fakeSteward as any,
      1,
    );

    expect(calls).toEqual([]);
    expect(fakeSteward.encodeFunctionData).not.toHaveBeenCalled();
  });

  it("skips asset when USD value is below threshold", async () => {
    const { calculateUsdValue } = require("../helpers/value");

    setHappyPathMocks("0xTokenLowValue");
    calculateUsdValue.mockReturnValueOnce(BigNumber.from("1000"));

    const calls = await buildMigrationCalls(
      {} as ethers.providers.Provider,
      baseAddresses as any,
      fakeSteward as any,
      1,
    );

    expect(calls).toEqual([]);
    expect(fakeSteward.encodeFunctionData).not.toHaveBeenCalled();
  });

  it("uses corePool when chainId is not 1 (non‑mainnet)", async () => {
    setHappyPathMocks("0xTokenHappyPathPolygon");

    await buildMigrationCalls(
      {} as ethers.providers.Provider,
      baseAddresses as any,
      fakeSteward as any,
      137,
    );

    expect(fakeSteward.encodeFunctionData).toHaveBeenCalledWith(
      "migrateV2toV3",
      expect.arrayContaining([expect.any(String), "0xCore", expect.any(String), expect.any(String)]),
    );
  });
});
