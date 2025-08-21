jest.mock("../constants", () => ({
    PRIME_MAINNET_TOKENS: new Set(["0xPrimeMockToken"]),
  }));
  
  import { getDestinationPool } from "../helpers/getDestinationPool";
  
  describe("getDestinationPool", () => {
    const primePool = "0xPrime";
    const corePool = "0xCore";
  
    it("returns prime pool for mainnet prime asset", () => {
      const asset = "0xPrimeMockToken"; // mocked as prime
      const result = getDestinationPool(1, asset, primePool, corePool);
      expect(result).toBe(primePool);
    });
  
    it("returns core pool for non-mainnet", () => {
      const asset = "0xToken";
      const result = getDestinationPool(137, asset, primePool, corePool);
      expect(result).toBe(corePool);
    });
  
    it("returns core pool if no prime pool", () => {
      const asset = "0xPrimeMockToken"; 
      const result = getDestinationPool(1, asset, undefined, corePool);
      expect(result).toBe(corePool);
    });
  
    it("returns core pool if not a prime asset", () => {
      const asset = "0xNotPrime";
      const result = getDestinationPool(1, asset, primePool, corePool);
      expect(result).toBe(corePool);
    });
  });
  