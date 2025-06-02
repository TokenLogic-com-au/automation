import { ethers } from "ethers";

export const getProviderMap = (rpcUrls: Record<number, string>) => {
    const map: Record<number, ethers.providers.JsonRpcProvider> = {};
    for (const [id, url] of Object.entries(rpcUrls)) {
      if (url) map[Number(id)] = new ethers.providers.JsonRpcProvider(url);
    }
    return map;
  };
  