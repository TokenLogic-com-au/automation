import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "ethers";

export async function getMigratableAmount(
  asset: string,
  balance: BigNumber,
  dataProviderV2: Contract,
  migrationBps: number,
  maxBps: number
): Promise<BigNumber | null> {
  try {
    const { availableLiquidity } = await dataProviderV2.getReserveData(asset);

    const amount = balance.lt(availableLiquidity)
      ? balance
      : availableLiquidity;

    if (amount.isZero()) return null;

    const adjusted = amount.mul(migrationBps).div(maxBps);
    return adjusted.isZero() ? null : adjusted;
  } catch {
    return null;
  }
}
