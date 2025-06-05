import { ethers } from "ethers";
import { buildEncodedCalls } from "../helpers/chainCalls";
import { Interface, FunctionFragment } from "ethers/lib/utils";
import { proposeSafeMulticall } from "../helpers/safe";

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const WSTETH = "0x7f39c581f595b53c5cb5bb5985d66ec2a7a6a2d2";
const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const GHO = "0x3f3a32b5ee3f858a58b3cc9b69ee65e7b6f72df1";

const fakeBalances: Record<string, ethers.BigNumber> = {
  [WETH.toLowerCase()]: ethers.utils.parseEther("1"),
  [WSTETH.toLowerCase()]: ethers.utils.parseEther("1"),
  [DAI.toLowerCase()]: ethers.utils.parseEther("1000"),
  [GHO.toLowerCase()]: ethers.utils.parseEther("1000"),
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
            { tokenAddress: GHO },
          ]),
          getReserveConfigurationData: jest.fn().mockResolvedValue({
            decimals: 18,
            isActive: true,
            isFrozen: false,
          }),
        };
      }

      if (lower === "0xoracle") {
        return {
          getAssetsPrices: jest.fn().mockResolvedValue([
            ethers.BigNumber.from("1000000000000"), // WETH: $1000e8
            ethers.BigNumber.from("1100000000000"), // WSTETH: $1100e8
            ethers.BigNumber.from("100000000000"),  // DAI: $100e8 ×1000 = $100k > threshold
            ethers.BigNumber.from("10000000000"),   // GHO: $10e8, but ignored
          ]),
        };
      }

      // ERC20: balanceOf for the token address
      return {
        balanceOf: jest.fn().mockResolvedValue(
          fakeBalances[lower] ?? ethers.constants.Zero
        ),
      };
    },
  };
});

jest.mock("@safe-global/protocol-kit", () => {
  return {
    __esModule: true,
    default: {
      init: jest.fn().mockImplementation(() => {
        return {
          createTransaction: jest.fn().mockResolvedValue({ data: "tx-data" }),
          getTransactionHash: jest.fn().mockResolvedValue("tx-hash"),
          signHash: jest.fn().mockResolvedValue({ data: "signature" }),
        };
      }),
    },
  };
});

jest.mock("@safe-global/api-kit", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        proposeTransaction: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("buildEncodedCalls", () => {
  const mockStewardInterface = new Interface([
    "function depositV3(address pool, address reserve, uint256 amount)",
  ]);

  jest
    .spyOn(mockStewardInterface, "encodeFunctionData")
    .mockImplementation(
      (_: string | FunctionFragment, values?: readonly unknown[]) => {
        const [pool] = values ?? [];
        return `depositV3:${pool}`;
      }
    );

  const addresses = {
    dataProvider: "0xdata",
    priceOracle: "0xoracle",
    collector: "0xcollector",
    poolExposureSteward: "0xsteward",
    corePool: "0xCORE",
    primePool: "0xPRIME",
  };

  const testCases = [
    {
      chainId: 1,
      expected: ["depositV3:0xPRIME", "depositV3:0xPRIME", "depositV3:0xCORE"],
    },
    {
      chainId: 137,
      expected: ["depositV3:0xCORE", "depositV3:0xCORE", "depositV3:0xCORE"],
    },
    {
      chainId: 42161,
      expected: ["depositV3:0xCORE", "depositV3:0xCORE", "depositV3:0xCORE"],
    },
    {
      chainId: 10,
      expected: ["depositV3:0xCORE", "depositV3:0xCORE", "depositV3:0xCORE"],
    },
    {
      chainId: 8453,
      expected: ["depositV3:0xCORE", "depositV3:0xCORE", "depositV3:0xCORE"],
    },
  ];

  testCases.forEach(({ chainId, expected }) => {
    it(`routes correctly on chainId ${chainId}`, async () => {
      const result = await buildEncodedCalls(
        {} as any,
        addresses,
        mockStewardInterface,
        chainId
      );
      expect(result).toEqual(expect.arrayContaining(expected));
    });
  });
});

describe("proposeSafeMulticall", () => {
  const mockRpcUrl = "https://mock-rpc";
  const mockPrivateKey =
    "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";
  const mockSafeAddress = "0xSafeAddress";
  const mockTo = "0xTargetContract";
  const mockData = "0x1234";
  const mockChainId = 1;

  // Here we save the spyInstance in walletSpy to restore it later
  let walletSpy: jest.SpyInstance;

  beforeAll(() => {
    walletSpy = jest
      .spyOn(ethers, "Wallet")
      .mockImplementation((privateKey: any, provider: any) => {
        // Return an object with a simulated address
        return { address: "0xFakeWalletAddress" } as any;
      });
  });

  afterAll(() => {
    walletSpy.mockRestore();
  });

  it("should propose a transaction to Safe without throwing", async () => {
    await expect(
      proposeSafeMulticall(
        mockChainId,
        {} as any, // simulated provider
        mockRpcUrl,
        mockPrivateKey,
        mockSafeAddress,
        mockTo,
        mockData
      )
    ).resolves.not.toThrow();
  });
});
