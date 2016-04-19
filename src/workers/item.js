const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const async = require('gw2e-async-promises')
const rarities = require('../static/rarities.js')
const categories = require('../static/categories.js')
const accountValue = require('gw2e-account-value')
const tradingpostBlacklist = require('../static/tradingpostBlacklist.js')

const languages = ['en', 'de', 'fr', 'es']

async function initialize () {
  let collection = mongo.collection('items')
  collection.createIndex('id')
  collection.createIndex('lang')
  let exists = !!(await collection.find({}).limit(1).next())

  if (!exists) {
    await execute(loadItems)
    await execute(loadItemPrices)
    await execute(updateItemValues)
  }

  // Update the items once a day, at 2am
  schedule('0 0 2 * * *', loadItems, 60 * 60)

  // Update prices every 5 minutes (which is the gw2 cache time)
  schedule('*/5 * * * *', loadItemPrices)

  // Update item values every 5 minutes
  schedule('*/5 * * * *', updateItemValues)

  logger.info('Initialized item worker')
}

function loadItems () {
  return new Promise(async resolve => {
    let itemRequests = languages.map(lang => () => api().language(lang).items().all())
    let items = await async.parallel(itemRequests)

    // We save one row per item per language. This *does* take longer in
    // the worker, but it enables the server part to serve requests using nearly
    // no processing power, since it doesn't have to transform languages to
    // match the request. We could move the transforming to the mongodb server
    // using aggregates, but that's also processing for every request instead of a
    // little overhead when adding new items.
    let collection = mongo.collection('items')
    let updateFunctions = []

    for (let key in languages) {
      let lang = languages[key]
      let languageItems = items[key]
      languageItems.map(item => {
        item = {...transformItem(item), lang: lang}
        updateFunctions.push(() => collection.update({id: item.id, lang: lang}, {'$set': item}, {upsert: true}))
      })
    }

    await async.parallel(updateFunctions)
    resolve()
  })
}

function loadItemPrices () {
  return new Promise(async resolve => {
    let prices = await api().commerce().prices().all()
    let collection = mongo.collection('items')

    let updateFunctions = prices.map(price => () =>
      new Promise(async resolve => {
        // Find the item matching the price, update the price based on the first match
        // and then overwrite the prices for all matches (= all languages)
        let item = await collection.find({id: price.id, tradable: true}).limit(1).next()

        if (!item) return resolve()
        item = transformPrices(item, price)
        await collection.update({id: price.id}, {'$set': item}, {multi: true})
        resolve()
      })
    )

    await async.parallel(updateFunctions)
    resolve()
  })
}

function updateItemValues () {
  return new Promise(async resolve => {
    let collection = mongo.collection('items')
    let attributes = {_id: 0, id: 1, sell: 1, buy: 1, crafting: 1, vendor_price: 1, value: 1}
    let items = await collection.find({lang: 'en'}, attributes).toArray()

    let updateFunctions = items.map(item => () =>
      new Promise(async resolve => {
        let itemValue
        let inheritedItem = accountValue.itemInherits(item.id)

        // This item inherits the value of an other item
        if (inheritedItem && inheritedItem.id) {
          let valueItem = items.find(i => i.id === inheritedItem.id)
          itemValue = accountValue.itemValue(valueItem) * inheritedItem.count + (inheritedItem.gold || 0)
        }

        // This item has a hardcoded gold value
        if (inheritedItem && !inheritedItem.id) {
          itemValue = inheritedItem.gold
        }

        // This item is just worth what it is worth! :)
        if (!inheritedItem) {
          itemValue = accountValue.itemValue(item)
        }

        // Don't update the value if it's still the same
        if (itemValue === item.value) {
          return resolve()
        }

        let update = {
          value: itemValue,
          valueIsVendor: itemValue === item.vendor_price
        }

        await collection.update({id: item.id}, {'$set': update}, {multi: true})
        resolve()
      })
    )

    await async.parallel(updateFunctions)

    // Get the average value for ascended boxes based on the average
    // of all ascended weapon and armor that might come out of boxes
    let ascendedAverage = await collection.aggregate([
      {
        $match: {
          rarity: 6,
          craftable: true,
          lang: 'en',
          'category.0': {$in: [0, 14]},
          valueIsVendor: false,
          name: {$regex: '(\'s|wupwup|Veldrunner|Zintl|Veldrunner|Angchu)', $options: 'i'},
          value: {$gt: 0}
        }
      },
      {$group: {_id: null, average: {$avg: '$value'}}}
    ]).limit(1).next()

    // We don't have any ascended items, so let's not bother
    // This can happen during testing or during server setup
    if (ascendedAverage === null) {
      return resolve()
    }

    ascendedAverage = Math.round(ascendedAverage.average)

    // Find ascended boxes ids (we are filtering out the recipes here)
    let ids = await collection.find(
      {
        rarity: 6,
        'category.0': 4,
        'category.1': {$in: [0, 1]},
        lang: 'en',
        name: {'$regex': '(chest|hoard)', '$options': 'i'}
      },
      {_id: 0, id: 1}
    ).toArray()

    // Update all ascended boxes with the average price
    await collection.update({id: {$in: ids.map(i => i.id)}}, {$set: {value: ascendedAverage}}, {multi: true})
    resolve()
  })
}

// Transform an item into the expected legacy structure
function transformItem (item) {
  return {
    id: item.id,
    name: item.name,
    description: transformDescription(item.description),
    image: item.icon,
    level: transformLevel(item.level),
    vendor_price: transformVendorPrice(item.vendor_value, item.flags),
    rarity: transformRarity(item.rarity),
    skins: transformSkins(item),
    tradable: transformTradable(item.flags, item.id),
    category: transformCategory(item.type, item.details)
  }
}

function transformLevel (level) {
  return level === 0 ? null : parseInt(level, 10)
}

function transformVendorPrice (vendor_price, flags) {
  return flags.indexOf('NoSell') !== -1 ? null : vendor_price
}

function transformRarity (rarity) {
  return rarities[rarity]
}

function transformSkins (item) {
  let skins = []

  if (item.default_skin) {
    skins.push(item.default_skin)
  }

  if (item.details && item.details.skins) {
    skins = skins.concat(item.details.skins)
  }

  return skins
}

function transformDescription (description) {
  if (!description || description === '') {
    return null
  }
  return description.replace(/<[^>]+>/ig, '')
}

function transformCategory (type, details) {
  let categoryIds = []

  if (type) {
    categoryIds.push(categories[type][0])
  }

  if (type && details && details.type) {
    categoryIds.push(categories[type][1][details.type])
  }

  return categoryIds
}

function transformTradable (flags, id) {
  if (tradingpostBlacklist.indexOf(id) !== -1) {
    return false
  }

  let untradableFlags = ['AccountBound', 'MonsterOnly', 'SoulbindOnAcquire']
  return flags.filter(x => untradableFlags.indexOf(x) !== -1).length === 0
}

function transformPrices (item, prices) {
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

// Return the date as a ISO 8601 string
function isoDate (date) {
  date = date ? new Date(date) : new Date()
  return date.toISOString().slice(0, 19) + '+0000'
}

module.exports = {initialize, loadItems, loadItemPrices, updateItemValues}
