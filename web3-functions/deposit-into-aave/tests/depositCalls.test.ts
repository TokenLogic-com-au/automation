import { ethers } from "ethers";
import { buildDepositCalls } from "../helpers/depositCalls";
import { FunctionFragment } from "ethers/lib/utils";
import { STEWARD_ABI } from "../abis";
import { WETH, WSTETH, GHO, DAI } from "../constants";

const fakeBalances: Record<string, ethers.BigNumber> = {
  [WETH.toLowerCase()]: ethers.utils.parseEther("1"), // $1,000
  [WSTETH.toLowerCase()]: ethers.utils.parseEther("1"), // $1,100
  [DAI.toLowerCase()]: ethers.utils.parseEther("1000"), // $100,000
  [GHO.toLowerCase()]: ethers.utils.parseEther("1000"), // $10,000
};

jest.mock("@ethersproject/contracts", () => {
  return {
    Contract: function (address: string, abi: any, provider: any) {
      const lower = address.toLowerCase();

      if (lower === "0xoracle") {
        return {
          getAssetsPrices: jest.fn().mockResolvedValue([
            ethers.BigNumber.from("100000000000"), // WETH: $1,000
            ethers.BigNumber.from("110000000000"), // WSTETH: $1,100
            ethers.BigNumber.from("10000000000"), // DAI: $100
            ethers.BigNumber.from("1000000000"), // GHO: $10
          ]),
        };
      }

      return {
        balanceOf: jest
          .fn()
          .mockResolvedValue(fakeBalances[lower] ?? ethers.constants.Zero),
      };
    },
  };
});

const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

describe("buildEncodedCalls", () => {
  jest
    .spyOn(stewardInterface, "encodeFunctionData")
    .mockImplementation(
      (_: string | FunctionFragment, values?: readonly unknown[]): string => {
        const [pool, reserve, amount] = values ?? [];
        const priceMap: Record<string, ethers.BigNumber> = {
          [WETH]: ethers.BigNumber.from("100000000000"),
          [WSTETH]: ethers.BigNumber.from("110000000000"),
          [DAI]: ethers.BigNumber.from("10000000000"),
          [GHO]: ethers.BigNumber.from("1000000000"),
        };

        const price = priceMap[reserve as string];
        const normalizedAmountInUsd = ethers.BigNumber.from(amount as string)
          .mul(price)
          .div(ethers.constants.WeiPerEther);

        return `depositV3:${pool}:${normalizedAmountInUsd.toString()}`;
      }
    );

  const addresses = {
    priceOracle: "0xoracle",
    collector: "0xcollector",
    corePoolV3: "0xCORE",
    primePoolV3: "0xPRIME",
    poolExposureSteward: "0xsteward",
    dataProviderV3: "0xdata",
    corePoolV2: "0xCORE",
    dataProviderV2: "0xdata",
  };

  const reservesV3 = [
    { tokenAddress: WETH },
    { tokenAddress: WSTETH },
    { tokenAddress: DAI },
    { tokenAddress: GHO },
  ];

  const configs = [
    { decimals: 18, isActive: true, isFrozen: false },
    { decimals: 18, isActive: true, isFrozen: false },
    { decimals: 18, isActive: true, isFrozen: false },
    { decimals: 18, isActive: true, isFrozen: false },
  ];

  const DEPOSITCALL_MIN_USD_THRESHOLD = ethers.BigNumber.from("1000");

  it("encodes deposit calls correctly for mainnet", async () => {
    const result = await buildDepositCalls(
      {} as any,
      addresses,
      stewardInterface,
      1,
      reservesV3,
      configs,
      { DEPOSITCALL_MIN_USD_THRESHOLD }
    );

    expect(result).toEqual(
      expect.arrayContaining([
        "depositV3:0xPRIME:100000000000", // WETH: $1,000
        "depositV3:0xPRIME:110000000000", // WSTETH: $1,100
        "depositV3:0xCORE:10000000000000", // DAI: $100,000
        "depositV3:0xCORE:10000000000000", // GHO: $10,000
      ])
    );
  });
});
