import { getV2TokenBalancesToMigrate } from "../helpers/getTokenBalancesToMigrate";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "ethers";
import { ERC20_ABI } from "../abis";

jest.mock("@ethersproject/contracts", () => ({
  Contract: jest.fn(),
}));

const mockGetReserveTokensAddresses = jest.fn();
const mockBalanceOf = jest.fn();

const ContractMock = Contract as unknown as jest.Mock;

ContractMock.mockImplementation((address: string, abi: any, provider: any) => {
  if (abi === ERC20_ABI) {
    return {
      balanceOf: mockBalanceOf,
    };
  }
  return {
    getReserveTokensAddresses: mockGetReserveTokensAddresses,
  };
});

describe("getV2TokenBalancesToMigrate", () => {
  const provider = {} as any;
  const collector = "0xCollector";
  const dataProviderV2 = new Contract("0xDataProvider", [], provider);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a token when it has a valid aTokenAddress and non-zero balance", async () => {
    const token = "0xToken";
    const aToken = "0xAToken";

    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: aToken,
    });

    mockBalanceOf.mockResolvedValueOnce(BigNumber.from("1000"));

    const result = await getV2TokenBalancesToMigrate(provider, dataProviderV2, collector, [
      { tokenAddress: token },
    ]);

    expect(result).toEqual([
      {
        token: token.toLowerCase(),
        aTokenAddress: aToken,
        balance: BigNumber.from("1000"),
      },
    ]);
  });

  it("skips token when aTokenAddress is zero", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0x0000000000000000000000000000000000000000",
    });

    const result = await getV2TokenBalancesToMigrate(provider, dataProviderV2, collector, [
      { tokenAddress: "0xInvalidToken" },
    ]);

    expect(result).toEqual([]);
  });

  it("skips token when balance is zero", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0xAToken",
    });
    mockBalanceOf.mockResolvedValueOnce(BigNumber.from(0));

    const result = await getV2TokenBalancesToMigrate(provider, dataProviderV2, collector, [
      { tokenAddress: "0xTokenWithZeroBalance" },
    ]);

    expect(result).toEqual([]);
  });

  it("skips token when getReserveTokensAddresses throws", async () => {
    mockGetReserveTokensAddresses.mockRejectedValueOnce(new Error("fail"));

    const result = await getV2TokenBalancesToMigrate(provider, dataProviderV2, collector, [
      { tokenAddress: "0xTokenThatFailsReserveLookup" },
    ]);

    expect(result).toEqual([]);
  });

  it("skips token when balanceOf throws", async () => {
    mockGetReserveTokensAddresses.mockResolvedValueOnce({
      aTokenAddress: "0xAToken",
    });

    mockBalanceOf.mockRejectedValueOnce(new Error("balance error"));

    const result = await getV2TokenBalancesToMigrate(provider, dataProviderV2, collector, [
      { tokenAddress: "0xTokenThatFailsBalance" },
    ]);

    expect(result).toEqual([]);
  });
});
