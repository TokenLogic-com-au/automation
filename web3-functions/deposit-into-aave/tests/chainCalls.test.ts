import { ethers } from "ethers";
import { buildEncodedCalls } from "../helpers/chainCalls";
import { FunctionFragment } from "ethers/lib/utils";
import { STEWARD_ABI } from "../abis";
import {
  WETH,
  WSTETH,
  GHO,
  DAI
} from "../constants";

const fakeBalances: Record<string, ethers.BigNumber> = {
  [WETH]: ethers.utils.parseEther("1"),
  [WSTETH]: ethers.utils.parseEther("1"),
  [DAI]: ethers.utils.parseEther("1000"),
  [GHO]: ethers.utils.parseEther("1000")
};

jest.mock("@ethersproject/contracts", () => {
  return {
    Contract: function (address: string, abi: any, provider: any) {
      const lower = address.toLowerCase();

      if (lower === "0xdata") {
        return {
          getAllReservesTokens: jest.fn().mockResolvedValue([
            { tokenAddress: WETH },
            { tokenAddress: WSTETH },
            { tokenAddress: DAI },
            { tokenAddress: GHO }
          ]),
          getReserveConfigurationData: jest.fn().mockResolvedValue({
            decimals: 18,
            isActive: true,
            isFrozen: false
          })
        };
      }

      if (lower === "0xoracle") {
        return {
          getAssetsPrices: jest.fn().mockResolvedValue([
            ethers.BigNumber.from("100000000000"), // WETH: $1,000
            ethers.BigNumber.from("110000000000"), // WSTETH: $1,100
            ethers.BigNumber.from("10000000000"),  // DAI: $100
            ethers.BigNumber.from("1000000000")    // GHO: $10
          ])
        };
      }

      return {
        balanceOf: jest.fn().mockResolvedValue(
          fakeBalances[lower] ?? ethers.constants.Zero
        )
      };
    }
  };
});

const stewardInterface = new ethers.utils.Interface(STEWARD_ABI);

describe("buildEncodedCalls", () => {
  jest.spyOn(stewardInterface, "encodeFunctionData").mockImplementation(
    (_: string | FunctionFragment, values?: readonly unknown[]): string => {
      const [pool, reserve, amount] = values ?? [];
      const priceMap: Record<string, ethers.BigNumber> = {
        [WETH]: ethers.BigNumber.from("100000000000"),
        [WSTETH]: ethers.BigNumber.from("110000000000"),
        [DAI]: ethers.BigNumber.from("10000000000"),
        [GHO]: ethers.BigNumber.from("1000000000")
      };

      const price = priceMap[(reserve as string)];
      const normalizedAmountInUsd = ethers.BigNumber.from(amount as string)
        .mul(price)
        .div(ethers.constants.WeiPerEther);

      return `depositV3:${pool}:${normalizedAmountInUsd.toString()}`;
    }
  );

  const addresses = {
    dataProvider: "0xdata",
    priceOracle: "0xoracle",
    collector: "0xcollector",
    poolExposureSteward: "0xsteward",
    corePool: "0xCORE",
    primePool: "0xPRIME"
  };

  const testCases = [
    {
      chainId: 1,
      expected: [
        "depositV3:0xPRIME:100000000000",  // WETH
        "depositV3:0xPRIME:110000000000",  // WSTETH
        "depositV3:0xCORE:10000000000000"  // DAI
      ]
    }
  ];

  testCases.forEach(({ chainId, expected }) => {
    it(`routes correctly on chainId ${chainId}`, async () => {
      const result = await buildEncodedCalls(
        {} as any,
        addresses,
        stewardInterface,
        chainId
      );

      expect(result).toEqual(expect.arrayContaining(expected));
    });
  });
});
