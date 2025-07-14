import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers, providers } from "ethers";
import { ERC20_ABI } from "../abis";

export async function adjustForSupplyCap(
  asset: string,
  amount: BigNumber,
  supplyCap: BigNumber,
  decimals: number,
  dataProviderV3: Contract,
  provider: providers.Provider
): Promise<BigNumber | null> {
  if (supplyCap.isZero()) return amount;

  try {
    const { aTokenAddress } = await dataProviderV3.getReserveTokensAddresses(
      asset
    );

    if (!aTokenAddress || aTokenAddress === ethers.constants.AddressZero)
      return null;

    const v3SupplyContract = new Contract(aTokenAddress, ERC20_ABI, provider);
    const currentSupply: BigNumber = await v3SupplyContract.totalSupply();

    const normalizedCap = supplyCap.mul(BigNumber.from(10).pow(decimals));
    const roomLeft = normalizedCap.gt(currentSupply)
      ? normalizedCap.sub(currentSupply)
      : BigNumber.from(0);

    if (roomLeft.isZero()) return null;

    return roomLeft.lt(amount) ? roomLeft : amount;
  } catch {
    return null;
  }
}
