import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from "ethers";
import {
  AAVE_DATA_PROVIDER_V3_ABI,
  AAVE_DATA_PROVIDER_V2_ABI,
  AAVE_PRICE_ORACLE_ABI,
} from "../abis";
import { calculateUsdValue } from "./value";
import { AAVE_ADDRESSES } from "../constants";
import { getV2TokenBalancesToMigrate } from "./getTokenBalancesToMigrate";
import { getMigratableAmount } from "./getMigratableAmount";
import { adjustForSupplyCap } from "./adjustForSupplyCap";
import { getDestinationPool } from "./getDestinationPool";

type NetworkConfig = (typeof AAVE_ADDRESSES)[number];

export async function buildMigrationCalls(
  provider: ethers.providers.Provider,
  addresses: NetworkConfig,
  steward: ethers.utils.Interface,
  chainId: number,
  v3Reserves: { tokenAddress: string }[],
  configs: { decimals: number }[],
  migrationParams: {
    migrationMinUsdThreshold: ethers.BigNumber;
    maxBps: number;
    migrationBps: number;
  }
): Promise<string[]> {
  const {
    corePoolV2,
    dataProviderV2: dataProviderV2Address,
    dataProviderV3: dataProviderV3Address,
    priceOracle,
    collector,
    primePoolV3,
    corePoolV3,
  } = addresses;

  if (!corePoolV2 || !dataProviderV2Address) return [];

  const dataProviderV2 = new Contract(
    dataProviderV2Address,
    AAVE_DATA_PROVIDER_V2_ABI,
    provider
  );
  const dataProviderV3 = new Contract(
    dataProviderV3Address,
    AAVE_DATA_PROVIDER_V3_ABI,
    provider
  );
  const oracle = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  const tokenInfoList = await getV2TokenBalancesToMigrate(
    provider,
    dataProviderV2,
    collector,
    v3Reserves
  );

  const getAssetsToMigrate = tokenInfoList.filter(Boolean) as {
    token: string;
    aTokenAddress: string;
    balance: BigNumber;
  }[];

  if (getAssetsToMigrate.length === 0) return [];

  const prices = await oracle.getAssetsPrices(
    getAssetsToMigrate.map((e) => e.token)
  );
  const caps = await Promise.all(
    getAssetsToMigrate.map((e) =>
      dataProviderV3
        .getReserveCaps(e.token)
        .catch(() => [ethers.constants.Zero, ethers.constants.Zero])
    )
  );

  const calls = (
    await Promise.all(
      getAssetsToMigrate.map(async (entry, i) => {
        const { token: asset, balance, aTokenAddress } = entry;
        const { decimals } = configs[i];

        try {
          if (
            !ethers.utils.isAddress(aTokenAddress) ||
            aTokenAddress === ethers.constants.AddressZero
          )
            return null;

          let amount = await getMigratableAmount(
            asset,
            balance,
            dataProviderV2,
            migrationParams.migrationBps,
            migrationParams.maxBps
          );
          if (!amount) return null;

          const valueUsd = calculateUsdValue(amount, prices[i], decimals);
          if (valueUsd.lt(migrationParams.migrationMinUsdThreshold))
            return null;

          const supplyCap = caps[i][1];
          const adjustedAmount = await adjustForSupplyCap(
            asset,
            amount,
            supplyCap,
            decimals,
            dataProviderV3,
            provider
          );
          if (!adjustedAmount) return null;

          const destPool = getDestinationPool(
            chainId,
            asset,
            primePoolV3,
            corePoolV3
          );

          return steward.encodeFunctionData("migrateV2toV3", [
            corePoolV2,
            destPool,
            asset,
            adjustedAmount.toString(),
          ]);
        } catch {
          return null;
        }
      })
    )
  ).filter((c): c is string => !!c);

  return calls;
}
