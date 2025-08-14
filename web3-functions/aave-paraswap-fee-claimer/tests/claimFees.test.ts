import { claimFees } from "../claimFees";
import { Network } from "../helpers/constants";
import { BigNumber } from "ethers";

// Mock Contract
jest.mock("ethers", () => {
  const actual = jest.requireActual("ethers");
  return {
    ...actual,
    Contract: jest.fn(),
  };
});

// Mock GelatoRelay
jest.mock("@gelatonetwork/relay-sdk", () => {
  return {
    GelatoRelay: jest.fn().mockImplementation(() => ({
      sponsoredCall: jest.fn().mockResolvedValue({
        taskId: "task-123",
        status: "ok",
      }),
    })),
  };
});

describe("claimFees", () => {
  const dummyProvider = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully claim fees and update decimals", async () => {
    const { Contract } = require("ethers");
    Contract.mockImplementation(() => ({
      getAllReservesTokens: jest.fn().mockResolvedValue([
        { symbol: "USDC", tokenAddress: "0xUSDC" },
        { symbol: "DAI", tokenAddress: "0xDAI" },
      ]),
      batchGetClaimable: jest.fn().mockResolvedValue([
        BigNumber.from("2000000000000000000"), // 2 tokens
        BigNumber.from("0"),
      ]),
      getAssetsPrices: jest.fn().mockResolvedValue([
        BigNumber.from("1000000000000000000"), // $1
        BigNumber.from("1000000000000000000"),
      ]),
      getReserveConfigurationData: jest
        .fn()
        .mockResolvedValue({ decimals: BigNumber.from(18) }),
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue("0xEncodedData"),
      },
    }));

    const result = await claimFees(
      Network.Mainnet,
      dummyProvider,
      "dummy-api-key",
      {}
    );

    expect(result.success).toBe(true);
    expect(result.decimals["0xUSDC"]).toBe(18);
    expect(result.decimals["0xDAI"]).toBeUndefined();
  });

  it("should skip claiming if RPC limit reached", async () => {
    const { Contract } = require("ethers");
    Contract.mockImplementation(() => ({
      getAllReservesTokens: jest.fn().mockResolvedValue([
        { symbol: "T1", tokenAddress: "0xT1" },
        { symbol: "T2", tokenAddress: "0xT2" },
        { symbol: "T3", tokenAddress: "0xT3" },
      ]),
      batchGetClaimable: jest.fn().mockResolvedValue([
        BigNumber.from("1"),
        BigNumber.from("1"),
        BigNumber.from("1"),
      ]),
      getAssetsPrices: jest.fn().mockResolvedValue([
        BigNumber.from("1"),
        BigNumber.from("1"),
        BigNumber.from("1"),
      ]),
      getReserveConfigurationData: jest
        .fn()
        .mockResolvedValue({ decimals: BigNumber.from(18) }),
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue("0xEncodedData"),
      },
    }));

    const result = await claimFees(
      Network.Mainnet,
      dummyProvider,
      "dummy-api-key",
      {}
    );

    expect(result.success).toBe(false); // Exceeds MAX_RPC_CALLS_PER_CLAIM
  });

  it("should return false if network is not configured", async () => {
    const result = await claimFees(
      9999 as Network,
      dummyProvider,
      "dummy-api-key",
      {}
    );

    expect(result.success).toBe(false);
  });

  it("should skip if no token exceeds the USD threshold", async () => {
    const { Contract } = require("ethers");
    Contract.mockImplementation(() => ({
      getAllReservesTokens: jest.fn().mockResolvedValue([
        { symbol: "TEST", tokenAddress: "0xLOW" },
      ]),
      batchGetClaimable: jest.fn().mockResolvedValue([
        BigNumber.from("1"), // Very low balance
      ]),
      getAssetsPrices: jest.fn().mockResolvedValue([
        BigNumber.from("1"), // Very low price
      ]),
      getReserveConfigurationData: jest
        .fn()
        .mockResolvedValue({ decimals: BigNumber.from(18) }),
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue("0xEncodedData"),
      },
    }));

    const result = await claimFees(
      Network.Mainnet,
      dummyProvider,
      "dummy-api-key",
      {}
    );

    expect(result.success).toBe(true); // No claimable tokens is not an error
    expect(result.decimals["0xLOW"]).toBe(18);
  });
});
