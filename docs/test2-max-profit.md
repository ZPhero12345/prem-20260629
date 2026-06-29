# Test No. 2: Stock Profit Calculator (Max Profit Algorithm)

**[🏠 Quick Start](/README.md) | [📈 Test No. 1: Crypto Chart](/docs/test1-crypto-chart.md) | [🧮 Test No. 2: Max Profit](/docs/test2-max-profit.md)**

---

## Project Overview

A highly optimized TypeScript algorithm and Jest testing suite designed to calculate the maximum potential profit from a chronological sequence of asset/stock prices. The implementation guarantees a single-pass traversal that solves the problem in linear time with constant memory.

---

## Technical Design & Solutions

- **Single-Pass Greedy Traversal ($\mathcal{O}(n)$ Time / $\mathcal{O}(1)$ Space)**: Rather than nested loops ($\mathcal{O}(n^2)$), the algorithm maintains a running tracking of the `minPrice` encountered so far. At each step, it calculates the profit if sold at the `currentPrice` and updates `maxProfit` if the new profit is higher, achieving maximum speed and zero memory overhead.
- **Floating-Point Precision Guard**: To handle assets with sub-dollar micro-fluctuations (common in volatile cryptocurrency markets, e.g. fractions like `$0.0001`), the profit is rounded using `Math.round(diff * 1e10) / 1e10` to bypass standard floating-point representation bugs (IEEE 754 precision issues).
- **Graceful Boundary Handlers**: Returns `0` instantly if the input array is null, empty, or contains only a single day's price (since buying and selling requires at least two distinct days).

---

## Project Structure
- [maxProfit.ts](file:///d:/prem-20260629/testNo2-App/maxProfit.ts): Contains the core algorithm function `findMaxProfit` and a runnable CLI demo.
- [maxProfit.test.ts](file:///d:/prem-20260629/testNo2-App/maxProfit.test.ts): Comprehensive unit test suite.

---

## Unit Test Plan

The following table outlines the complete test suite designed to validate the algorithm across all market scenarios and boundary edge cases. For detailed assertions and execution logs, please inspect [maxProfit.test.ts](file:///d:/prem-20260629/testNo2-App/maxProfit.test.ts).

| Test ID | Scenario / Focus | Input Prices Array | Expected Output | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Baseline happy path | `[2, 3, 6, 4, 3]` | `4` | Standard upward drift with correction |
| **TC-02** | Volatile market | `[7, 1, 5, 3, 6, 4]` | `5` | Multiple peaks and valleys |
| **TC-03** | Decimal / floating-point | `[10.50, 11.25, 10.10, 12.85, 12.00]` | `2.75` | Standard asset float prices |
| **TC-04** | Sub-dollar micro-fractions | `[0.0001, 0.0005, 0.0002]` | `0.0004` | Volatile micro-crypto asset ticks |
| **TC-05** | Monotonically decreasing | `[5, 4, 3, 2, 1]` | `0` | Bear market trend (no profitable trade) |
| **TC-06** | Stagnant market | `[3.33, 3.33, 3.33]` | `0` | Flat pricing profile (no profit) |
| **TC-07** | Absolute peak on Day 1 | `[10, 3, 2, 1]` | `0` | Initial peak with steady decline |
| **TC-08** | Absolute trough on final day | `[3.50, 5.00, 9.50, 2.00, 1.00]` | `6.00` | Trough occurs too late to sell; uses prior peak |
| **TC-09** | Empty array boundary | `[]` | `0` | Zero inputs boundary check |
| **TC-10** | Single day price boundary | `[5.50]` | `0` | Requires buy and sell on separate days |
| **TC-11** | Minimal bounds (2 days) | `[2.10, 10.30]` | `8.20` | Minimum transactional trade duration |
| **TC-12** | Performance stress test | `50,000` elements (decreasing) | `0` | Must run in linear $\mathcal{O}(n)$ time ($<10\text{ms}$) |

---

## How to Run Locally & Verify

1. **Navigate to the Project Directory**:
   ```bash
   cd testNo2-App
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   *(Or use `npm install` / `yarn install` if preferred)*

3. **Run Unit Tests (Jest)**:
   ```bash
   pnpm test
   ```

4. **Execute CLI Script Demo**:
   ```bash
   npx ts-node maxProfit.ts
   ```
