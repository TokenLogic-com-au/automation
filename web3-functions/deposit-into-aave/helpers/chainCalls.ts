import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { AAVE_DATA_PROVIDER_ABI, AAVE_PRICE_ORACLE_ABI, ERC20_ABI } from "../abis";
import { AAVE_ADDRESSES } from "../constants";
import { calculateUsdValue } from "./value";

const MIN_USD_THRESHOLD = ethers.BigNumber.from(1000);

// Ignored tokens
const IGNORED_TOKENS = new Set([
  "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f".toLowerCase() // GHO
]);

// Tokens to deposit into prime pool
const PRIME_MAINNET_TOKENS = new Set([
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".toLowerCase(), // wETH
  "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0".toLowerCase()  // wstETH
]);

export async function buildEncodedCalls(
  provider: ethers.providers.Provider,
  addresses: typeof AAVE_ADDRESSES[number],
  stewardInterface: ethers.utils.Interface,
  chainId: number
): Promise<string[]> {
  const { dataProvider, priceOracle, collector, corePool, primePool } = addresses;

  const dataProviderContract = new Contract(dataProvider, AAVE_DATA_PROVIDER_ABI, provider);
  const priceOracleContract = new Contract(priceOracle, AAVE_PRICE_ORACLE_ABI, provider);

  const reserves = await dataProviderContract.getAllReservesTokens();
  if (!reserves.length) return [];

  const tokens = reserves.map((r: { tokenAddress: string }) => r.tokenAddress.toLowerCase());
  const prices = await priceOracleContract.getAssetsPrices(tokens);
  const configs = await Promise.all(
    tokens.map((token: string) => dataProviderContract.getReserveConfigurationData(token))
  );

  const encodedCalls: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (IGNORED_TOKENS.has(token)) continue;

    const { decimals, isActive, isFrozen } = configs[i];
    if (!isActive || isFrozen) continue;

    const erc20 = new Contract(token, ERC20_ABI, provider);
    const balance = await erc20.balanceOf(collector);
    const valueUsd = calculateUsdValue(balance, prices[i], decimals);

    if (valueUsd.gte(MIN_USD_THRESHOLD)) {
      const isMainnet = chainId === 1;

      const pool =
        isMainnet && PRIME_MAINNET_TOKENS.has(token) && primePool
          ? primePool
          : corePool;

      const depositData = stewardInterface.encodeFunctionData("depositV3", [
        pool,
        token,
        balance.toString()
      ]);
      encodedCalls.push(depositData);
    }
  }

  return encodedCalls;
}
