import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from "ethers";
import {
  AAVE_DATA_PROVIDER_V3_ABI,
  AAVE_DATA_PROVIDER_V2_ABI,
  AAVE_PRICE_ORACLE_ABI,
  ERC20_ABI,
} from "../abis";
import { calculateUsdValue } from "./value";
import { AAVE_ADDRESSES, PRIME_MAINNET_TOKENS } from "../constants";
import { getV2TokenBalancesToMigrate } from "./getTokenBalancesToMigrate";

type NetworkConfig = (typeof AAVE_ADDRESSES)[number];

export async function buildMigrationCalls(
  provider: ethers.providers.Provider,
  addresses: NetworkConfig,
  steward: ethers.utils.Interface,
  chainId: number,
  v3Reserves: { tokenAddress: string }[],
  configs: { decimals: number }[],
  migrationParams: {
    MIGRATION_MIN_USD_THRESHOLD: ethers.BigNumber;
    MAX_BPS: number;
    MIGRATION_BPS: number;
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
        const asset = entry.token;
        const balance = entry.balance;
        const aTokenV2 = entry.aTokenAddress;
        const { decimals } = configs[i];

        try {
          if (!aTokenV2 || aTokenV2 === ethers.constants.AddressZero)
            return null;
          if (balance.isZero()) return null;

          const valueUsd = calculateUsdValue(balance, prices[i], decimals);
          if (valueUsd.lt(migrationParams.MIGRATION_MIN_USD_THRESHOLD))
            return null;

          const { availableLiquidity } = await dataProviderV2.getReserveData(
            asset
          );
          let amount = balance.lt(availableLiquidity)
            ? balance
            : availableLiquidity;
          if (amount.isZero()) return null;

          amount = amount
            .mul(migrationParams.MIGRATION_BPS)
            .div(migrationParams.MAX_BPS);
          if (amount.isZero()) return null;

          const supplyCap = caps[i][1];
          if (!supplyCap.isZero()) {
            const { aTokenAddress: v3AToken } =
              await dataProviderV3.getReserveTokensAddresses(asset);
            if (!v3AToken || v3AToken === ethers.constants.AddressZero)
              return null;

            const v3SupplyContract = new Contract(
              v3AToken,
              ERC20_ABI,
              provider
            );
            const v3Supply: BigNumber = await v3SupplyContract.totalSupply();

            const normalizedCap = supplyCap.mul(
              ethers.BigNumber.from(10).pow(decimals)
            );
            const roomLeft = normalizedCap.gt(v3Supply)
              ? normalizedCap.sub(v3Supply)
              : BigNumber.from(0);

            if (roomLeft.isZero()) return null;
            if (roomLeft.lt(amount)) amount = roomLeft;
          }

          const destPool =
            chainId === 1 && primePoolV3 && PRIME_MAINNET_TOKENS.has(asset)
              ? primePoolV3
              : corePoolV3;

          return steward.encodeFunctionData("migrateV2toV3", [
            corePoolV2,
            destPool,
            asset,
            amount.toString(),
          ]);
        } catch {
          return null;
        }
      })
    )
  ).filter((c): c is string => !!c);

  return calls;
}
