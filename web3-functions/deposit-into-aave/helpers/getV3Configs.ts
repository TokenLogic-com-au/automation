import { Contract } from "@ethersproject/contracts";

export const getV3ConfigsAndReserves = async (
  dataProviderContract: Contract
) => {
  const reserves = await dataProviderContract.getAllReservesTokens();
  const tokens = reserves.map((r: { tokenAddress: string }) =>
    r.tokenAddress.toLowerCase()
  );

  const configs = await Promise.all(
    tokens.map((token: string) =>
      dataProviderContract.getReserveConfigurationData(token)
    )
  );

  return { reserves, configs };
};
