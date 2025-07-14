import { PRIME_MAINNET_TOKENS } from "../constants";

export function getDestinationPool(
  chainId: number,
  asset: string,
  primePoolV3: string | undefined,
  corePoolV3: string
): string {
  const isMainnetPrimeAsset =
    chainId === 1 && primePoolV3 && PRIME_MAINNET_TOKENS.has(asset);

  return isMainnetPrimeAsset ? primePoolV3 : corePoolV3;
}
