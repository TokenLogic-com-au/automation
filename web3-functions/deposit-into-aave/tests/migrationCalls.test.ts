import { buildMigrationCalls } from "../helpers/migrationCalls";
import { BigNumber, ethers } from "ethers";

jest.mock("../helpers/getTokenBalancesToMigrate", () => ({
  getV2TokenBalancesToMigrate: jest.fn(() =>
    Promise.resolve([
      {
        token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        aTokenAddress: "0x028171bca77440897b824ca71d1c56cac55b68a3",
        balance: BigNumber.from("1000000000000000000"), // 1e18
      },
    ])
  ),
}));

jest.mock("../helpers/getMigratableAmount", () => ({
  getMigratableAmount: jest.fn((_asset, balance) => {
    if (balance.isZero()) return Promise.resolve(null);
    return Promise.resolve(
      BigNumber.from("900000000000000000") // 90% de 1e18
    );
  }),
}));

jest.mock("../helpers/adjustForSupplyCap", () => ({
  adjustForSupplyCap: jest.fn((_asset, amount) => Promise.resolve(amount)),
}));

jest.mock("../helpers/value", () => ({
  calculateUsdValue: jest.fn(() => BigNumber.from("20000000000")), // 200 USD 
}));

jest.mock("../helpers/getDestinationPool", () => ({
  getDestinationPool: jest.fn(
    () => "0x87870bca3f3fd6036b8d4ce8303d71e081e3637e"
  ),
}));

jest.mock("@ethersproject/contracts", () => {
  return {
    Contract: jest.fn((address: string) => {
      const lowerCaseAddress = address.toLowerCase();

      if (lowerCaseAddress === "0xa50ba011c48153de246e5192c8f9258a2ba79ca9") {
        return {
          getAssetsPrices: jest.fn().mockResolvedValue([
            BigNumber.from("200000000000"), // 2000 USD * 1e8
          ]),
        };
      }

      if (lowerCaseAddress === "0x497a1994c46d4f6c864904a9f1fac6328cb7c8a6") {
        return {
          getReserveCaps: jest.fn().mockResolvedValue([
            BigNumber.from(0), // borrow cap
            BigNumber.from("1000000"), // supply cap
          ]),
        };
      }

      if (lowerCaseAddress === "0x057835ad21a177dbdd3090bb1cae03eacf78fc6d") {
        return {
          getReserveData: jest.fn().mockResolvedValue({
            availableLiquidity: BigNumber.from("1000000000000000000"), // 1e18
          }),
          getReserveTokensAddresses: jest.fn().mockResolvedValue({
            aTokenAddress: "0x028171bca77440897b824ca71d1c56cac55b68a3",
          }),
        };
      }

      if (lowerCaseAddress === "0x028171bca77440897b824ca71d1c56cac55b68a3") {
        return {
          balanceOf: jest
            .fn()
            .mockResolvedValue(BigNumber.from("1000000000000000000")),
        };
      }

      return {};
    }),
  };
});

describe("buildMigrationCalls", () => {
  // Test case: Happy path - should return an encoded call when all conditions are met.
  it("returns encoded call for migratable token", async () => {
    const provider = {} as ethers.providers.Provider;

    const addresses = {
      poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
      corePoolV2: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      dataProviderV2: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d",
      dataProviderV3: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
      priceOracle: "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9",
      collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
      corePoolV3: "0x87870Bca3F3fD6036b8D4ce8303d71e081e3637e",
      primePoolV3: undefined,
    };

    const mockStewardInterface = {
      encodeFunctionData: jest.fn(() => "0xencodedCall"),
    } as unknown as ethers.utils.Interface;

    const v3Reserves = [
      { tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    ];
    const configs = [{ decimals: 18 }];
    const migrationParams = {
      MIGRATION_MIN_USD_THRESHOLD: BigNumber.from("10000000000"), // 100 USD
      MAX_BPS: 10000,
      MIGRATION_BPS: 9000,
    };

    const result = await buildMigrationCalls(
      provider,
      addresses,
      mockStewardInterface,
      1,
      v3Reserves,
      configs,
      migrationParams
    );

    expect(result).toEqual(["0xencodedCall"]);
    expect(mockStewardInterface.encodeFunctionData).toHaveBeenCalledWith(
      "migrateV2toV3",
      [
        "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
        "0x87870bca3f3fd6036b8d4ce8303d71e081e3637e",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "900000000000000000",
      ]
    );
  });

  // Test case: Unhappy path - should skip migration if the asset's USD value is below the minimum threshold.
  it("skips migration if value is under threshold", async () => {
    const provider = {} as ethers.providers.Provider;

    const addresses = {
      poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
      corePoolV2: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      dataProviderV2: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d",
      dataProviderV3: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
      priceOracle: "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9",
      collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
      corePoolV3: "0x87870Bca3F3fD6036b8D4ce8303d71e081e3637e",
      primePoolV3: undefined,
    };

    const mockStewardInterface = {
      encodeFunctionData: jest.fn(() => "0xencodedCall"),
    } as unknown as ethers.utils.Interface;

    const v3Reserves = [
      { tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    ];
    const configs = [{ decimals: 18 }];
    const migrationParams = {
      MIGRATION_MIN_USD_THRESHOLD: BigNumber.from("30000000000"), // 300 USD
      MAX_BPS: 10000,
      MIGRATION_BPS: 9000,
    };

    const result = await buildMigrationCalls(
      provider,
      addresses,
      mockStewardInterface,
      1,
      v3Reserves,
      configs,
      migrationParams
    );

    expect(result).toEqual([]);
  });

  // Test case: Unhappy path - should return an empty array if there are no assets to migrate from V2.
  it("returns empty array when there are no assets to migrate", async () => {
    const provider = {} as ethers.providers.Provider;
    const addresses = {
      poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
      corePoolV2: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      dataProviderV2: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d",
      dataProviderV3: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
      priceOracle: "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9",
      collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
      corePoolV3: "0x87870Bca3F3fD6036b8D4ce8303d71e081e3637e",
      primePoolV3: undefined,
    };

    const mockStewardInterface = {
      encodeFunctionData: jest.fn(() => "0xencodedCall"),
    } as unknown as ethers.utils.Interface;

    const v3Reserves = [
      { tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    ];
    const configs = [{ decimals: 18 }];
    const migrationParams = {
      MIGRATION_MIN_USD_THRESHOLD: BigNumber.from("10000000000"), // 100 USD
      MAX_BPS: 10000,
      MIGRATION_BPS: 9000,
    };

    require("../helpers/getTokenBalancesToMigrate").getV2TokenBalancesToMigrate.mockResolvedValueOnce(
      []
    );

    const result = await buildMigrationCalls(
      provider,
      addresses,
      mockStewardInterface,
      1,
      v3Reserves,
      configs,
      migrationParams
    );

    expect(result).toEqual([]);
  });

  // Test case: Unhappy path - should skip migration if the asset's balance is zero.
  it("skips migration if balance is zero", async () => {
    const provider = {} as ethers.providers.Provider;
    const addresses = {
      poolExposureSteward: "0x22aC12a6937BBBC0a301AF9154d08EaD95673122",
      corePoolV2: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      dataProviderV2: "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d",
      dataProviderV3: "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6",
      priceOracle: "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9",
      collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
      corePoolV3: "0x87870Bca3F3fD6036b8D4ce8303d71e081e3637e",
      primePoolV3: undefined,
    };

    const mockStewardInterface = {
      encodeFunctionData: jest.fn(() => "0xencodedCall"),
    } as unknown as ethers.utils.Interface;

    const v3Reserves = [
      { tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
    ];
    const configs = [{ decimals: 18 }];
    const migrationParams = {
      MIGRATION_MIN_USD_THRESHOLD: BigNumber.from("10000000000"), // 100 USD
      MAX_BPS: 10000,
      MIGRATION_BPS: 9000,
    };

    require("../helpers/getTokenBalancesToMigrate").getV2TokenBalancesToMigrate.mockResolvedValueOnce(
      [
        {
          token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          aTokenAddress: "0x028171bca77440897b824ca71d1c56cac55b68a3",
          balance: BigNumber.from("0"), // 0 balance
        },
      ]
    );

    const result = await buildMigrationCalls(
      provider,
      addresses,
      mockStewardInterface,
      1,
      v3Reserves,
      configs,
      migrationParams
    );

    expect(result).toEqual([]);
  });
});
