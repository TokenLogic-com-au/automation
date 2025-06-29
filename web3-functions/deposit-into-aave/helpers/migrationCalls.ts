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

const MIN_USD_THRESHOLD = ethers.BigNumber.from(15_000);
const MIGRATION_PERCENT = 90;

type NetworkConfig = (typeof AAVE_ADDRESSES)[number];

export async function buildMigrationCalls(
  provider: ethers.providers.Provider,
  addresses: NetworkConfig,
  steward: ethers.utils.Interface,
  chainId: number
): Promise<string[]> {
  const {
    v2Pool,
    dataProviderV2,
    dataProviderV3,
    priceOracle,
    collector,
    primePool,
    corePool,
  } = addresses;

  if (!v2Pool || !dataProviderV2) {
    return [];
  }

  const dpV2 = new Contract(dataProviderV2, AAVE_DATA_PROVIDER_V2_ABI, provider);
  const dpV3 = new Contract(dataProviderV3, AAVE_DATA_PROVIDER_V3_ABI, provider);
  const oracle = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  const v3Reserves = await dpV3.getAllReservesTokens();
  if (v3Reserves.length === 0) return [];

  const underlyings = v3Reserves.map(
    (r: { tokenAddress: string }) => r.tokenAddress.toLowerCase()
  );

  const prices: BigNumber[] = await oracle.getAssetsPrices(underlyings);

  const caps: [BigNumber, BigNumber][] = await Promise.all(
    underlyings.map(async (asset: string) => {
      try {
        return await dpV3.getReserveCaps(asset);
      } catch {
        return [ethers.constants.Zero, ethers.constants.Zero];
      }
    })
  );

  const decimals: number[] = await Promise.all(
    underlyings.map(async (asset: string) => {
      try {
        const conf = await dpV2.getReserveConfigurationData(asset);
        return conf.decimals;
      } catch {
        return 18;
      }
    })
  );

  const calls: string[] = [];

  for (let i = 0; i < underlyings.length; i++) {
    const asset = underlyings[i];

    const { aTokenAddress: aTokenV2 } = await dpV2.getReserveTokensAddresses(
      asset
    );
    if (!aTokenV2 || aTokenV2 === ethers.constants.AddressZero) continue;

    const balance: BigNumber = await new Contract(
      aTokenV2,
      ERC20_ABI,
      provider
    ).balanceOf(collector);
    if (balance.isZero()) continue;

    const { availableLiquidity } = await dpV2.getReserveData(asset);
    let amount = balance.lt(availableLiquidity) ? balance : availableLiquidity;
    if (amount.isZero()) continue;

    const valueUsd = calculateUsdValue(amount, prices[i], decimals[i]);
    if (valueUsd.lt(MIN_USD_THRESHOLD)) continue;

    amount = amount.mul(MIGRATION_PERCENT).div(100);
    if (amount.isZero()) continue;

    const supplyCap = caps[i][1];
    if (!supplyCap.isZero()) {
      const { aTokenAddress: v3AToken } = await dpV3.getReserveTokensAddresses(
        asset
      );
      if (!v3AToken || v3AToken === ethers.constants.AddressZero) continue;

      const v3Supply = await new Contract(
        v3AToken,
        ERC20_ABI,
        provider
      ).totalSupply();
      const roomLeft =
        supplyCap.gt(v3Supply) ? supplyCap.sub(v3Supply) : BigNumber.from(0);
      if (roomLeft.isZero()) continue;
      if (roomLeft.lt(amount)) amount = roomLeft;
    }

    const destPool =
      chainId === 1 && primePool && PRIME_MAINNET_TOKENS.has(asset)
        ? primePool
        : corePool;

    calls.push(
      steward.encodeFunctionData("migrateV2toV3", [
        v2Pool,
        destPool,
        asset,
        amount,
      ])
    );
    console.log(`✅ Queued ${asset}: ${amount.toString()} → ${destPool}`);
  }

  return calls;
}
