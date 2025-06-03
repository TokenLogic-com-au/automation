import { ethers } from "ethers";

/// @dev Number of decimals used by the Aave Price Oracle
const PRICE_DECIMALS = 8;

export const calculateUsdValue = (
    balance: ethers.BigNumber,
    price: ethers.BigNumber,
    decimals: number
  ): ethers.BigNumber => {
    return price
      .mul(balance)
      .div(ethers.BigNumber.from(10).pow(decimals))
      .div(ethers.BigNumber.from(10).pow(PRICE_DECIMALS));
  };
