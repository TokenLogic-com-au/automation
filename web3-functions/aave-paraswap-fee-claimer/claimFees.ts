import { Network } from "./helpers/constants";
import {
  AAVE_ADDRESSES,
  TokenData,
  ReserveConfigurationData,
} from "./helpers/constants";
import {
  AAVE_PARASWAP_FEE_CLAIMER_ABI,
  AAVE_DATA_PROVIDER_ABI,
  AAVE_PRICE_ORACLE_ABI,
} from "./helpers/abis";
import { BigNumber, Contract } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

const MIN_USD_VALUE_FOR_CLAIM = 100_000_000_000_000_000_000n;
const MAX_RPC_CALLS_PER_CLAIM = 2;

const gelatoRelay = new GelatoRelay();

export const claimFees = async (
  chainId: Network,
  provider: StaticJsonRpcProvider,
  relayApiKey: string,
  tokenDecimals: Record<string, number>
): Promise<{ success: boolean; decimals: Record<string, number> }> => {
  const networkAddresses = AAVE_ADDRESSES[chainId];

  if (!networkAddresses) {
    console.log("Network not configured");
    return { success: false, decimals: tokenDecimals };
  }

  const feeClaimerContract = new Contract(
    networkAddresses.feeClaimer,
    AAVE_PARASWAP_FEE_CLAIMER_ABI,
    provider
  );
  const dataProviderContract = new Contract(
    networkAddresses.dataProvider,
    AAVE_DATA_PROVIDER_ABI,
    provider
  );
  const priceOracleContract = new Contract(
    networkAddresses.priceOracle,
    AAVE_PRICE_ORACLE_ABI,
    provider
  );

  const allTokens: TokenData[] =
    await dataProviderContract.getAllReservesTokens();
  const tokenAddresses = allTokens.map((token) => token.tokenAddress);

  const claimableBalances: BigNumber[] =
    await feeClaimerContract.batchGetClaimable(tokenAddresses);
  const tokenPrices: BigNumber[] = await priceOracleContract.getAssetsPrices(
    tokenAddresses
  );

  let rpcCallCount = 0;
  const claimableTokens: string[] = [];

  for (let i = 0; i < tokenAddresses.length; i++) {
    if (claimableBalances[i].gt(0)) {
      let tokenDecimal = tokenDecimals[tokenAddresses[i]];

      if (!tokenDecimal) {
        if (rpcCallCount >= MAX_RPC_CALLS_PER_CLAIM) {
          return { success: false, decimals: tokenDecimals };
        }

        const reserveConfig: ReserveConfigurationData =
          await dataProviderContract.getReserveConfigurationData(
            tokenAddresses[i]
          );

        tokenDecimal = reserveConfig.decimals.toNumber();
        tokenDecimals[tokenAddresses[i]] = tokenDecimal;

        rpcCallCount++;
      }

      const usdValue =
        (claimableBalances[i].toBigInt() * tokenPrices[i].toBigInt()) /
        BigInt(10) ** BigInt(tokenDecimal);

      console.log(chainId, tokenAddresses[i], usdValue);

      if (usdValue >= MIN_USD_VALUE_FOR_CLAIM) {
        claimableTokens.push(tokenAddresses[i]);
      }
    }
  }

  if (claimableTokens.length) {
    const result = await gelatoRelay.sponsoredCall(
      {
        chainId: BigInt(chainId),
        target: networkAddresses.feeClaimer,
        data: feeClaimerContract.interface.encodeFunctionData(
          "batchClaimToCollector",
          [claimableTokens]
        ),
      },
      relayApiKey
    );
    console.log(result);
  } else {
    console.log(Network[chainId], "No claimable tokens found!");
  }

  return { success: true, decimals: tokenDecimals };
};
