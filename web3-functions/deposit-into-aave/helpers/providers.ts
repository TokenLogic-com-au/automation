import { ethers } from "ethers";

export const getProvider = (chainId: number, rpcUrls: Record<number, string>): ethers.providers.JsonRpcProvider | null => {
  const url = rpcUrls[chainId];
  return url ? new ethers.providers.JsonRpcProvider(url) : null;
};
