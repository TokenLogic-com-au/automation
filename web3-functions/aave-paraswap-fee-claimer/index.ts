import {
    Web3Function,
    Web3FunctionContext,
  } from "@gelatonetwork/web3-functions-sdk";
  import { Contract } from "@ethersproject/contracts";
  import { GelatoRelay } from "@gelatonetwork/relay-sdk";
  import { StaticJsonRpcProvider } from "@ethersproject/providers";
  import { BigNumber } from "ethers";
  
  type AaveContractAddresses = {
    feeClaimer: string;
    dataProvider: string;
    priceOracle: string;
  };
  
  type TokenData = {
    symbol: string;
    tokenAddress: string;
  };
  
  type ReserveConfigurationData = {
    decimals: BigNumber;
    ltv: BigNumber;
    liquidationThreshold: BigNumber;
    liquidationBonus: BigNumber;
    reserveFactor: BigNumber;
    usageAsCollateralEnabled: boolean;
    borrowingEnabled: boolean;
    stableBorrowRateEnabled: boolean;
    isActive: boolean;
    isFrozen: boolean;
  };
  
  enum Network {
    Mainnet = 1,
    Arbitrum = 42161,
    Avalanche = 43114,
    Base = 8453,
    BSC = 56,
    Optimism = 10,
    Polygon = 137,
    PolygonZkEvm = 1101,
    Scroll = 534352,
    ZkSync = 324,
    Metis = 1088,
    Linea = 59144,
  }
  
  const MIN_USD_VALUE_FOR_CLAIM = 100_000_000_000_000_000_000n;
  const MAX_RPC_CALLS_PER_UPDATE = 5;
  const MAX_RPC_CALLS_PER_CLAIM = 2;
  
  const AAVE_PARASWAP_FEE_CLAIMER_ABI = [
    {
      inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
      name: "batchClaimToCollector",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
      name: "batchGetClaimable",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "contract IERC20", name: "asset", type: "address" }],
      name: "claimToCollector",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  
  const AAVE_DATA_PROVIDER_ABI = [
    {
      inputs: [],
      name: "getAllReservesTokens",
      outputs: [
        {
          components: [
            { internalType: "string", name: "symbol", type: "string" },
            { internalType: "address", name: "tokenAddress", type: "address" },
          ],
          internalType: "struct IPoolDataProvider.TokenData[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "asset", type: "address" }],
      name: "getReserveConfigurationData",
      outputs: [
        { internalType: "uint256", name: "decimals", type: "uint256" },
        { internalType: "uint256", name: "ltv", type: "uint256" },
        { internalType: "uint256", name: "liquidationThreshold", type: "uint256" },
        { internalType: "uint256", name: "liquidationBonus", type: "uint256" },
        { internalType: "uint256", name: "reserveFactor", type: "uint256" },
        { internalType: "bool", name: "usageAsCollateralEnabled", type: "bool" },
        { internalType: "bool", name: "borrowingEnabled", type: "bool" },
        { internalType: "bool", name: "stableBorrowRateEnabled", type: "bool" },
        { internalType: "bool", name: "isActive", type: "bool" },
        { internalType: "bool", name: "isFrozen", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];
  
  const AAVE_PRICE_ORACLE_ABI = [
    {
      inputs: [{ internalType: "address[]", name: "assets", type: "address[]" }],
      name: "getAssetsPrices",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function",
    },
  ];
  
  const AAVE_ADDRESSES: Record<number, AaveContractAddresses> = {
    [Network.Mainnet]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x41393e5e337606dc3821075Af65AeE84D7688CBD",
      priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
    [Network.Arbitrum]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7",
    },
    [Network.Avalanche]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C",
    },
    [Network.Base]: {
      feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
      dataProvider: "0xd82a47fdebB5bf5329b09441C3DaB4b5df2153Ad",
      priceOracle: "0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156",
    },
    [Network.BSC]: {
      feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
      dataProvider: "0x23dF2a19384231aFD114b036C14b6b03324D79BC",
      priceOracle: "0x39bc1bfDa2130d6Bb6DBEfd366939b4c7aa7C697",
    },
    [Network.Optimism]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0xD81eb3728a631871a7eBBaD631b5f424909f0c77",
    },
    [Network.Polygon]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0xb023e699F5a33916Ea823A16485e259257cA8Bd1",
    },
    [Network.PolygonZkEvm]: {
      feeClaimer: "0xAe940e61E9863178b71500c9B5faE2a04Da361a1",
      dataProvider: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
      priceOracle: "0x3e652E97ff339B73421f824F5b03d75b62F1Fb51",
    },
    [Network.Scroll]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
    [Network.ZkSync]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
    [Network.Metis]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
    [Network.Linea]: {
      feeClaimer: "0x9abf798f5314BFd793A9E57A654BEd35af4A1D60",
      dataProvider: "0x7F23D86Ee20D869112572136221e173428DD740B",
      priceOracle: "0x54586bE62E3c3580375aE3723C145253060Ca0C2",
    },
  };
  
  const gelatoRelay = new GelatoRelay();
  
  const claimFees = async (
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
  
    const allTokens: TokenData[] = await dataProviderContract.getAllReservesTokens();
    const tokenAddresses = allTokens.map((token) => token.tokenAddress);
  
    const claimableBalances: BigNumber[] = await feeClaimerContract.batchGetClaimable(
      tokenAddresses
    );
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
            await dataProviderContract.getReserveConfigurationData(tokenAddresses[i]);
  
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
  
  const updateTokenDecimals = async (
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
  
      const allTokens: TokenData[] = await dataProviderContract.getAllReservesTokens();
      const tokenAddresses = allTokens.map((token) => token.tokenAddress);
      rpcCallCount++;
  
      if (rpcCallCount >= MAX_RPC_CALLS_PER_UPDATE) {
        return tokenDecimals;
      }
  
      for (const tokenAddress of tokenAddresses) {
        if (tokenDecimals[tokenAddress]) {
          continue;
        }
  
        console.log(tokenAddress);
  
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
  
  Web3Function.onRun(async (context: Web3FunctionContext) => {
    const { userArgs, multiChainProvider, secrets, storage } = context;
  
    const { chainIds, duration } = userArgs as {
      chainIds: Network[];
      duration: number;
    };
  
    const nextIndex = Number((await storage.get("nextIndex")) ?? "0");
    let tokenDecimals = JSON.parse((await storage.get("decimals")) ?? "{}");
  
    const lastExecuted = Number((await storage.get(`${nextIndex}`)) ?? "0");
    const now = Date.now();
  
    const relayApiKey = await secrets.get("RELAY_API_KEY");
    if (!relayApiKey) {
      tokenDecimals = await updateTokenDecimals(
        nextIndex,
        chainIds,
        multiChainProvider,
        tokenDecimals
      );
      await storage.set("decimals", JSON.stringify(tokenDecimals));
      return { canExec: false, message: "Sponsor API Key not configured" };
    }
  
    if (now < lastExecuted + duration) {
      tokenDecimals = await updateTokenDecimals(
        nextIndex,
        chainIds,
        multiChainProvider,
        tokenDecimals
      );
      await storage.set("decimals", JSON.stringify(tokenDecimals));
      await storage.set(
        "nextIndex",
        ((nextIndex + 1) % chainIds.length).toString()
      );
      return { canExec: false, message: "Minimum time between claims not reached" };
    }
  
    const result = await claimFees(
      chainIds[nextIndex],
      multiChainProvider.chainId(chainIds[nextIndex]),
      relayApiKey,
      tokenDecimals
    );
  
    if (result.success) {
      await storage.set(
        "nextIndex",
        ((nextIndex + 1) % chainIds.length).toString()
      );
    }
  
    await storage.set(`${nextIndex}`, now.toString());
    await storage.set("decimals", JSON.stringify(result.decimals));
  
    return {
      canExec: false,
      message: "Successfully claimed tokens",
    };
  });