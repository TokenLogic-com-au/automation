import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { AAVE_PRICE_ORACLE_ABI, ERC20_ABI } from "../abis";
import {
  AAVE_ADDRESSES,
  IGNORED_TOKENS,
} from "../constants";
import { calculateUsdValue } from "./value";
import { getDestinationPool } from "./getDestinationPool";

export async function buildDepositCalls(
  provider: ethers.providers.Provider,
  addresses: (typeof AAVE_ADDRESSES)[number],
  stewardInterface: ethers.utils.Interface,
  chainId: number,
  reservesV3: { tokenAddress: string }[],
  configs: { decimals: number; isActive: boolean; isFrozen: boolean }[],
  depositCallParams: { depositCallMinUsdThreshold: ethers.BigNumber }
): Promise<string[]> {
  const { priceOracle, collector, corePoolV3, primePoolV3 } = addresses;

  const priceOracleContract = new Contract(
    priceOracle,
    AAVE_PRICE_ORACLE_ABI,
    provider
  );

  if (!reservesV3.length) return [];

  const tokens = reservesV3.map((r: { tokenAddress: string }) =>
    r.tokenAddress.toLowerCase()
  );
  const prices = await priceOracleContract.getAssetsPrices(tokens);

  const encodedCalls: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (IGNORED_TOKENS.has(token)) continue;

    const { decimals, isActive, isFrozen } = configs[i];
    if (!isActive || isFrozen) continue;

    const erc20 = new Contract(token, ERC20_ABI, provider);
    const balance = await erc20.balanceOf(collector);
    const valueUsd = calculateUsdValue(balance, prices[i], decimals);

    if (valueUsd.gte(depositCallParams.depositCallMinUsdThreshold)) {

      const destPool = getDestinationPool(chainId, token, primePoolV3, corePoolV3);

      const depositData = stewardInterface.encodeFunctionData("depositV3", [
        destPool,
        token,
        balance.toString(),
      ]);
      encodedCalls.push(depositData);
    }
  }

  return encodedCalls;
}
