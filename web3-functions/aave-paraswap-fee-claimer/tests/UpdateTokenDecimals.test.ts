import { updateTokenDecimals } from "../updateTokenDecimals";
import { Network } from "../helpers/constants";
import { BigNumber } from "ethers";

// Mocks
jest.mock("ethers", () => {
  const original = jest.requireActual("ethers");
  return {
    ...original,
    Contract: jest.fn().mockImplementation(() => ({
      getAllReservesTokens: jest.fn().mockResolvedValue([
        { symbol: "USDC", tokenAddress: "0xUSDC" },
        { symbol: "DAI", tokenAddress: "0xDAI" },
      ]),
      getReserveConfigurationData: jest
        .fn()
        .mockResolvedValue({ decimals: BigNumber.from(6) }),
    })),
  };
});

describe("updateTokenDecimals", () => {
  const mockProvider = {};
  const multiChainProvider = {
    chainId: jest.fn().mockReturnValue(mockProvider),
  };

  const mockTokenDecimals: Record<string, number> = {};

  it("should update token decimals and respect the max RPC call limit", async () => {
    const updated = await updateTokenDecimals(
      0,
      [Network.Mainnet, Network.Polygon],
      multiChainProvider,
      mockTokenDecimals
    );

    expect(updated).toHaveProperty("0xUSDC", 6);
    expect(updated).toHaveProperty("0xDAI", 6);
  });

  it("should return early if tokenDecimals already contains token", async () => {
    const mockWithExisting = {
      "0xDAI": 18,
    };

    const result = await updateTokenDecimals(
      0,
      [Network.Mainnet],
      multiChainProvider,
      mockWithExisting
    );

    expect(result["0xDAI"]).toBe(18);
  });
});
