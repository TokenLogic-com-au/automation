import {
  AAVE_ADDRESSES,
  TokenData,
  Network,
  ReserveConfigurationData,
} from "./helpers/constants";
import { AAVE_DATA_PROVIDER_ABI } from "./helpers/abis";

import { Contract } from "ethers";

const MAX_RPC_CALLS_PER_UPDATE = 5;

export const updateTokenDecimals = async (
  currentIndex: number,
  chainIds: Network[],
  multiChainProvider: any,
  tokenDecimals: Record<string, number>
): Promise<Record<string, number>> => {
  let rpcCallCount = 0;

  for (let i = 0; i < chainIds.length; i++) {
    const chainId = chainIds[(i + currentIndex) % chainIds.length];
    const provider = multiChainProvider.chainId(chainId);

    const networkAddresses = AAVE_ADDRESSES[chainId];

    if (!networkAddresses) {
      continue;
    }

    const dataProviderContract = new Contract(
      networkAddresses.dataProvider,
      AAVE_DATA_PROVIDER_ABI,
      provider
    );

    const allTokens: TokenData[] =
      await dataProviderContract.getAllReservesTokens();
    const tokenAddresses = allTokens.map((token) => token.tokenAddress);
    rpcCallCount++;

    if (rpcCallCount >= MAX_RPC_CALLS_PER_UPDATE) {
      return tokenDecimals;
    }

    for (const tokenAddress of tokenAddresses) {
      if (tokenDecimals[tokenAddress]) {
        continue;
      }

      const reserveConfig: ReserveConfigurationData =
        await dataProviderContract.getReserveConfigurationData(tokenAddress);

      tokenDecimals[tokenAddress] = reserveConfig.decimals.toNumber();
      rpcCallCount++;

      if (rpcCallCount >= MAX_RPC_CALLS_PER_UPDATE) {
        return tokenDecimals;
      }
    }
  }

  return tokenDecimals;
};
