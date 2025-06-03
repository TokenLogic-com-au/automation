import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { AAVE_DATA_PROVIDER_ABI, AAVE_PRICE_ORACLE_ABI, ERC20_ABI } from "../abis";
import { AAVE_ADDRESSES } from "../constants";
import { calculateUsdValue } from "./value";

/// @notice Minimum token USD value to consider for deposit into Aave V3
/// @dev Prevents adding low-value tokens to the Safe proposal
const MIN_USD_THRESHOLD = ethers.BigNumber.from(1000);

export async function buildEncodedCalls(
  provider: ethers.providers.Provider,
  addresses: typeof AAVE_ADDRESSES[number],
  stewardInterface: ethers.utils.Interface
): Promise<string[]> {
  const { dataProvider, priceOracle, collector, poolExposureSteward } = addresses;

  const dataProviderContract = new Contract(dataProvider, AAVE_DATA_PROVIDER_ABI, provider);
  const priceOracleContract = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  const reserves = await dataProviderContract.getAllReservesTokens();
  if (!reserves.length) return [];

  const tokens = reserves.map((r: { tokenAddress: string }) => r.tokenAddress);
  const prices = await priceOracleContract.getAssetsPrices(tokens);
  const configs = await Promise.all(
    tokens.map((token: string) => dataProviderContract.getReserveConfigurationData(token))
  );

  const encodedCalls: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const price = prices[i];
    const { decimals, isActive, isFrozen } = configs[i];

    if (!isActive || isFrozen) continue;

    const erc20 = new Contract(token, ERC20_ABI, provider);
    const balance = await erc20.balanceOf(collector);
    const valueUsd = calculateUsdValue(balance, price, decimals);

    if (valueUsd.gte(MIN_USD_THRESHOLD)) {
      const depositData = stewardInterface.encodeFunctionData("depositV3", [
        poolExposureSteward,
        token,
        balance.toString()
      ]);
      encodedCalls.push(depositData);
    }
  }

  return encodedCalls;
}
