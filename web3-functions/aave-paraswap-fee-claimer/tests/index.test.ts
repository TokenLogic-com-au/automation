import { Network } from "../helpers/constants";

// Mocks
const mockOnRun = jest.fn();

jest.mock("@gelatonetwork/web3-functions-sdk", () => ({
  Web3Function: {
    onRun: (fn: any) => mockOnRun.mockImplementation(fn),
  },
}));

jest.mock("../updateTokenDecimals", () => ({
  updateTokenDecimals: jest
    .fn()
    .mockImplementation(async (_i, _chains, _provider, tokenDecimals) => ({
      ...tokenDecimals,
      "0xABC": 6,
    })),
}));

jest.mock("../claimFees", () => ({
  claimFees: jest
    .fn()
    .mockImplementation(
      async (_chainId, _provider, _apiKey, tokenDecimals) => ({
        success: true,
        decimals: {
          ...tokenDecimals,
          "0xABC": 6,
        },
      })
    ),
}));

import "../index";

describe("Web3Function.onRun (main entry)", () => {
  const mockStorage: Record<string, string> = {};
  const mockContext = {
    userArgs: {
      chainIds: [Network.Mainnet],
      duration: 10000,
    },
    multiChainProvider: {
      chainId: jest.fn().mockReturnValue({}),
    },
    secrets: {
      get: jest.fn().mockResolvedValue("dummy-api-key"),
    },
    storage: {
      get: jest.fn((key: string) => Promise.resolve(mockStorage[key])),
      set: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
        return Promise.resolve();
      }),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key in mockStorage) delete mockStorage[key];
  });

  it("returns early if no API key", async () => {
    const ctx = {
      ...mockContext,
      secrets: {
        get: jest.fn().mockResolvedValue(null),
      },
    };

    const result = await mockOnRun(ctx as any);
    expect(result.canExec).toBe(false);
    expect(result.message).toMatch(/Sponsor API Key not configured/);
  });

  it("returns early if not enough time has passed", async () => {
    const now = Date.now();
    mockStorage["0"] = (now - 5000).toString();
    mockStorage["decimals"] = JSON.stringify({});

    const result = await mockOnRun(mockContext as any);
    expect(result.canExec).toBe(false);
    expect(result.message).toMatch(/Minimum time between claims not reached/);
  });

  it("executes claimFees and updates storage", async () => {
    const now = Date.now();
    mockStorage["0"] = (now - 20000).toString();
    mockStorage["decimals"] = JSON.stringify({});

    const result = await mockOnRun(mockContext as any);

    expect(result.canExec).toBe(false);
    expect(result.message).toBe("Successfully claimed tokens");
    expect(mockContext.storage.set).toHaveBeenCalledWith(
      "0",
      expect.any(String)
    );
    expect(mockContext.storage.set).toHaveBeenCalledWith(
      "decimals",
      expect.any(String)
    );
  });
});
