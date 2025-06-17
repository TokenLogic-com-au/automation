import { ethers } from "ethers";
import { executeDepositWithRole } from "../helpers/safe";

describe("executeDepositWithRole", () => {
  const mockChainId = 1;
  const mockPrivateKey = "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";
  const mockRolesModifierAddress = "0x000000000000000000000000000000000000cafe";
  const mockTarget = "0x000000000000000000000000000000000000dead";
  const mockCallData = "0x1234";

  const mockProvider = {} as ethers.providers.Provider;

  const mockSendTransaction = jest.fn().mockResolvedValue({
    hash: "0xtxhash",
    wait: jest.fn().mockResolvedValue({ status: 1 }),
  });

  beforeAll(() => {
    jest
      .spyOn(ethers, "Wallet")
      .mockImplementation(() => ({
        sendTransaction: mockSendTransaction,
      }) as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should send a transaction using execTransactionWithRole", async () => {
    await expect(
      executeDepositWithRole(
        mockChainId,
        mockProvider,
        mockPrivateKey,
        mockRolesModifierAddress,
        mockTarget,
        mockCallData
      )
    ).resolves.not.toThrow();

    expect(mockSendTransaction).toHaveBeenCalledTimes(1);
    const callArgs = mockSendTransaction.mock.calls[0][0];
    expect(callArgs.to).toBe(mockRolesModifierAddress);
    expect(callArgs.data).toContain(mockTarget.toLowerCase().substring(2));
  });
});
