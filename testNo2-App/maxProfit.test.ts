import { findMaxProfit } from './maxProfit';

describe('maxProfit Tests', () => {
  // TC-01: Assessment provided baseline example
  test('TC-01: Baseline happy path', () => {
    expect(findMaxProfit([2, 3, 6, 4, 3])).toBe(4);
  });

  // TC-02: Volatile market with multiple peaks and valleys
  test('TC-02: Volatile market', () => {
    expect(findMaxProfit([7, 1, 5, 3, 6, 4])).toBe(5);
  });

  // TC-03: Decimal and floating-point asset prices
  test('TC-03: Decimal and floating-point prices', () => {
    expect(findMaxProfit([10.50, 11.25, 10.10, 12.85, 12.00])).toBe(2.75);
  });

  // TC-04: Sub-dollar micro-fluctuations (Crypto assets)
  test('TC-04: Deep sub-dollar fractions', () => {
    expect(findMaxProfit([0.0001, 0.0005, 0.0002])).toBe(0.0004);
  });

  // TC-05: Monotonically decreasing market price trend
  test('TC-05: Monotonically decreasing trend', () => {
    expect(findMaxProfit([5, 4, 3, 2, 1])).toBe(0);
  });

  // TC-06: Completely flat or stagnant market
  test('TC-06: Stagnant market', () => {
    expect(findMaxProfit([3.33, 3.33, 3.33])).toBe(0);
  });

  // TC-07: Absolute peak occurs on Day 1
  test('TC-07: Absolute peak on Day 1', () => {
    expect(findMaxProfit([10, 3, 2, 1])).toBe(0);
  });

  // TC-08: Absolute trough occurs on the final day
  test('TC-08: Absolute trough on final day', () => {
    expect(findMaxProfit([3.50, 5.00, 9.50, 2.00, 1.00])).toBe(6.00);
  });

  // TC-09: Null or empty price array passing
  test('TC-09: Empty array handling', () => {
    expect(findMaxProfit([])).toBe(0);
  });

  // TC-10: Single day price tracking
  test('TC-10: Single day price list', () => {
    expect(findMaxProfit([5.50])).toBe(0);
  });

  // TC-11: Minimum transactional bounds (exactly two days)
  test('TC-11: Minimal bounds of exactly two days', () => {
    expect(findMaxProfit([2.10, 10.30])).toBe(8.20);
  });

  // TC-12: Large scale linear execution stress test
  test('TC-12: Performance stress test under 10ms', () => {
    const size = 50000;
    const largeArray = new Array(size);
    for (let i = 0; i < size; i++) {
      largeArray[i] = size - i;
    }

    const start = performance.now();
    const result = findMaxProfit(largeArray);
    const end = performance.now();
    const duration = end - start;

    expect(result).toBe(0);
    expect(duration).toBeLessThan(10);
  });
});
