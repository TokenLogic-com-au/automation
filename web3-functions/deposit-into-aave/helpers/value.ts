import { ethers } from "ethers";

export const calculateUsdValue = (
    balance: ethers.BigNumber,
    price: ethers.BigNumber,
    decimals: number
  ): ethers.BigNumber => {
    return price
      .mul(balance)
      .div(ethers.BigNumber.from(10).pow(decimals))
      .div(ethers.BigNumber.from(10).pow(8));
  };