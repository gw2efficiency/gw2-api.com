function transformPrices (item, prices) {
  prices = filterInvalidOffers(item, prices)

  let transformed = {
    buy: {
      quantity: prices.buys.quantity,
      price: prices.buys.unit_price,
      last_change: lastPriceChange(item.buy, prices.buys),
      last_known: lastKnown(prices, item, 'buy')
    },
    sell: {
      quantity: prices.sells.quantity,
      price: prices.sells.unit_price,
      last_change: lastPriceChange(item.sell, prices.sells),
      last_known: lastKnown(prices, item, 'sell')
    },
    last_update: isoDate()
  }

  // Add the crafting profit if a crafting price is set
  if (item.crafting) {
    let craftPrice = item.craftingWithoutPrecursors || item.crafting
    transformed.craftingProfit = Math.round(transformed.sell.price * 0.85 - craftPrice.buy)
  }

  return transformed
}

// Filters out invalid buy offers (below vendor price). These are
// still in from the start of the game, and we're gonna ignore them here
function filterInvalidOffers (item, prices) {
  if (!item.vendor_price) {
    return prices
  }

  // The minimum price seems to be a bit random, but this is close enough
  let minimumPrice = item.vendor_price + Math.max(Math.ceil(item.vendor_price * 0.18), 2)
  if (prices.buys.unit_price < minimumPrice) {
    prices.buys.unit_price = false
    prices.buys.quantity = 0
  }

  return prices
}

function lastPriceChange (memory, current) {
  if (!memory) {
    return {quantity: 0, price: 0, time: isoDate()}
  }

  if (memory.quantity === current.quantity && memory.price === current.unit_price) {
    return memory.last_change
  }

  return {
    quantity: current.quantity - memory.quantity,
    price: current.unit_price - memory.price,
    time: isoDate()
  }
}

function lastKnown (prices, item, type) {
  if (prices[type + 's'].unit_price) {
    return prices[type + 's'].unit_price
  }

  if (item[type] && item[type].price) {
    return item[type].price
  }

  if (item[type] && item[type].last_known) {
    return item[type].last_known
  }

  return false
}

function isoDate (date) {
  date = date ? new Date(date) : new Date()
  return date.toISOString().slice(0, 19) + '+0000'
}

module.exports = transformPrices
