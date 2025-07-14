import { getMigratableAmount } from "../helpers/getMigratableAmount";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "ethers";

describe("getMigratableAmount", () => {
  const mockGetReserveData = jest.fn();
  const dataProvider = {
    getReserveData: mockGetReserveData,
  } as unknown as Contract;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null if available liquidity is zero", async () => {
    mockGetReserveData.mockResolvedValue({ availableLiquidity: BigNumber.from("0") });

    const result = await getMigratableAmount(
      "0xAsset",
      BigNumber.from("100"),
      dataProvider,
      9000,
      10000
    );

    expect(result).toBeNull();
  });

  it("returns adjusted liquidity when less than balance", async () => {
    mockGetReserveData.mockResolvedValue({ availableLiquidity: BigNumber.from("50") });

    const result = await getMigratableAmount(
      "0xAsset",
      BigNumber.from("100"),
      dataProvider,
      9000,
      10000
    );

    expect(result?.toString()).toBe("45"); // 50 * 0.9
  });

  it("returns adjusted balance when less than liquidity", async () => {
    mockGetReserveData.mockResolvedValue({ availableLiquidity: BigNumber.from("1000") });

    const result = await getMigratableAmount(
      "0xAsset",
      BigNumber.from("500"),
      dataProvider,
      9000,
      10000
    );

    expect(result?.toString()).toBe("450"); // 500 * 0.9
  });

  it("returns null if adjusted amount is zero", async () => {
    mockGetReserveData.mockResolvedValue({ availableLiquidity: BigNumber.from("1") });

    const result = await getMigratableAmount(
      "0xAsset",
      BigNumber.from("1"),
      dataProvider,
      0,
      10000
    );

    expect(result).toBeNull();
  });
});
