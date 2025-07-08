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

  const dpV2 = new Contract(
    dataProviderV2,
    AAVE_DATA_PROVIDER_V2_ABI,
    provider
  );
  const dpV3 = new Contract(
    dataProviderV3,
    AAVE_DATA_PROVIDER_V3_ABI,
    provider
  );
  const oracle = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  const v3Reserves = await dpV3.getAllReservesTokens();
  if (v3Reserves.length === 0) return [];

  const tokenInfoList = await Promise.all(
    v3Reserves.map(async (r: { tokenAddress: string }) => {
      const token = r.tokenAddress.toLowerCase();
      try {
        const { aTokenAddress } = await dpV2.getReserveTokensAddresses(token);
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

  const eligible = tokenInfoList.filter(Boolean) as {
    token: string;
    aTokenAddress: string;
    balance: BigNumber;
  }[];

  if (eligible.length === 0) return [];

  const prices = await oracle.getAssetsPrices(eligible.map((e) => e.token));
  const caps = await Promise.all(
    eligible.map((e) =>
      dpV3
        .getReserveCaps(e.token)
        .catch(() => [ethers.constants.Zero, ethers.constants.Zero])
    )
  );
  const decimals = await Promise.all(
    eligible.map((e) =>
      dpV2
        .getReserveConfigurationData(e.token)
        .then((conf: { decimals: number }) => conf.decimals)
        .catch(() => 18)
    )
  );

  const calls = (
    await Promise.all(
      eligible.map(async (entry, i) => {
        const asset = entry.token;
        const balance = entry.balance;
        const aTokenV2 = entry.aTokenAddress;

        try {
          if (!aTokenV2 || aTokenV2 === ethers.constants.AddressZero)
            return null;
          if (balance.isZero()) return null;

          const valueUsd = calculateUsdValue(balance, prices[i], decimals[i]);

          if (valueUsd.lt(MIN_USD_THRESHOLD)) {
            return null;
          }

          const { availableLiquidity } = await dpV2.getReserveData(asset);
          let amount = balance.lt(availableLiquidity)
            ? balance
            : availableLiquidity;

          if (amount.isZero()) {
            return null;
          }

          amount = amount.mul(MIGRATION_PERCENT).div(100);
          if (amount.isZero()) {
            return null;
          }

          const supplyCap = caps[i][1];
          if (!supplyCap.isZero()) {
            const { aTokenAddress: v3AToken } =
              await dpV3.getReserveTokensAddresses(asset);
            if (!v3AToken || v3AToken === ethers.constants.AddressZero) {
              return null;
            }

            const v3SupplyContract = new Contract(
              v3AToken,
              ERC20_ABI,
              provider
            );
            const v3Supply: BigNumber = await v3SupplyContract.totalSupply();

            const normalizedCap = supplyCap.mul(
              ethers.BigNumber.from(10).pow(decimals[i])
            );
            const roomLeft = normalizedCap.gt(v3Supply)
              ? normalizedCap.sub(v3Supply)
              : BigNumber.from(0);

            if (roomLeft.isZero()) {
              return null;
            }

            if (roomLeft.lt(amount)) {
              amount = roomLeft;
            }
          }

          const destPool =
            chainId === 1 && primePool && PRIME_MAINNET_TOKENS.has(asset)
              ? primePool
              : corePool;

          const callData = steward.encodeFunctionData("migrateV2toV3", [
            v2Pool,
            destPool,
            asset,
            amount.toString(),
          ]);

          return callData;
        } catch (err) {
          return null;
        }
      })
    )
  ).filter((c): c is string => !!c);

  return calls;
}
