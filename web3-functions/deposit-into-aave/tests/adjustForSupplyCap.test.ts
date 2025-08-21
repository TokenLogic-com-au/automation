import { adjustForSupplyCap } from "../helpers/adjustForSupplyCap";
import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from "ethers";

jest.mock("@ethersproject/contracts", () => {
  return {
    Contract: jest.fn((address: string) => {
      if (address === "0xaToken") {
        return { totalSupply: mockTotalSupply };
      }
      return { getReserveTokensAddresses: mockGetReserveTokensAddresses };
    }),
  };
});

const mockGetReserveTokensAddresses = jest.fn();
const mockTotalSupply = jest.fn();
const provider = {} as any;

describe("adjustForSupplyCap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the original amount if cap is zero", async () => {
    const result = await adjustForSupplyCap(
      "0xAsset",
      BigNumber.from("100"),
      BigNumber.from("0"),
      18,
      new Contract("0xDataProviderV3", []),
      provider
    );

    expect(result?.toString()).toBe("100");
  });

  it("returns null if aTokenAddress is zero address", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: ethers.constants.AddressZero,
    });

    const result = await adjustForSupplyCap(
      "0xAsset",
      BigNumber.from("100"),
      BigNumber.from("1000"),
      18,
      new Contract("0xDataProviderV3", []),
      provider
    );

    expect(result).toBeNull();
  });

  it("returns the room left if it's less than amount", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0xaToken",
    });

    mockTotalSupply.mockResolvedValueOnce(BigNumber.from("900")); // current supply
    const supplyCap = BigNumber.from("1000"); // 1000 units
    const decimals = 0;

    const result = await adjustForSupplyCap(
      "0xAsset",
      BigNumber.from("200"), // requested amount
      supplyCap,
      decimals,
      new Contract("0xDataProviderV3", []),
      provider
    );

    expect(result?.toString()).toBe("100"); // 1000 - 900 = 100 left
  });

  it("returns the full amount if room is greater than amount", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0xaToken",
    });

    mockTotalSupply.mockResolvedValueOnce(BigNumber.from("100")); // current supply
    const supplyCap = BigNumber.from("1000");
    const decimals = 18;

    const result = await adjustForSupplyCap(
      "0xAsset",
      BigNumber.from("200"), // amount
      supplyCap,
      decimals,
      new Contract("0xDataProviderV3", []),
      provider
    );

    expect(result?.toString()).toBe("200");
  });

  it("returns null if roomLeft is zero", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0xaToken",
    });

    mockTotalSupply.mockResolvedValueOnce(BigNumber.from("1000"));
    const supplyCap = BigNumber.from("1"); // normalized cap = 10^18, but currentSupply > cap

    const result = await adjustForSupplyCap(
      "0xAsset",
      BigNumber.from("500"),
      supplyCap,
      0,
      new Contract("0xDataProviderV3", []),
      provider
    );

    expect(result).toBeNull();
  });
});
