export function findMaxProfit(stockPriceList: number[]): number {
  if (!stockPriceList || stockPriceList.length < 2) {
    return 0;
  }

  let minPrice = stockPriceList[0];
  let maxProfit = 0;

  for (let i = 1; i < stockPriceList.length; i++) {
    const currentPrice = stockPriceList[i];

    if (currentPrice < minPrice) {
      minPrice = currentPrice;
    } else {
      const profit = Math.round((currentPrice - minPrice) * 1e10) / 1e10;
      if (profit > maxProfit) {
        maxProfit = profit;
      }
    }
  }

  return maxProfit;
}

function main() {
  const stockPriceList = [2, 3, 1, 4, 3, 10, 8, 5];
  const maxProfit = findMaxProfit(stockPriceList);
  console.log(`Stock Prices: [${stockPriceList.join(', ')}]`);
  console.log(`Maximum Profit: ${maxProfit}`);
}

main();
