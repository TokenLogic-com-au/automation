import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from "ethers";
import { ERC20_ABI } from "../abis";

export type MigratableTokenInfo = {
  token: string;
  aTokenAddress: string;
  balance: BigNumber;
  v3Reserve: { tokenAddress: string };
};

export async function getV2TokenBalancesToMigrate(
  provider: ethers.providers.Provider,
  dataProviderV2: Contract,
  collector: string,
  v3Reserves: { tokenAddress: string }[]
): Promise<MigratableTokenInfo[]> {
  const tokenInfoList = await Promise.all(
    v3Reserves.map(async (r: { tokenAddress: string }) => {
      const token = r.tokenAddress.toLowerCase();
      try {
        const { aTokenAddress } =
          await dataProviderV2.getReserveTokensAddresses(token);
        if (!aTokenAddress || aTokenAddress === ethers.constants.AddressZero)
          return null;

        const balance = await new Contract(
          aTokenAddress,
          ERC20_ABI,
          provider
        ).balanceOf(collector);
        if (balance.isZero()) return null;

        return { token, aTokenAddress, balance };
      } catch {
        return null;
      }
    })
  );

  return tokenInfoList.filter(Boolean) as MigratableTokenInfo[];
}
