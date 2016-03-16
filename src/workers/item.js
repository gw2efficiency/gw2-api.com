const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const async = require('gw2e-async-promises')
const rarities = require('../static/rarities.js')
const categories = require('../static/categories.js')

const languages = ['en', 'de', 'fr', 'es']

async function initialize () {
  let collection = mongo.collection('items')
  collection.createIndex('id')
  collection.createIndex('lang')
  let exists = !!await collection.find({}).limit(1).next()

  if (!exists) {
    await execute(loadItems)
    await execute(loadItemPrices)
  }

  schedule(loadItems, 60 * 60)
  schedule(loadItemPrices, 60)
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
        updateFunctions.push(() =>
          collection.update({id: item.id, lang: lang}, {'$set': item}, {upsert: true})
        )
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

// Transform an item into the expected legacy structure
function transformItem (item) {
  return {
    id: item.id,
    name: item.name,
    description: transformDescription(item.description),
    image: item.icon,
    level: transformLevel(item.level),
    vendor_price: item.vendor_value,
    rarity: transformRarity(item.rarity),
    skin: transformSkin(item.default_skin),
    tradable: transformTradable(item.flags),
    category: transformCategory(item.type, item.details)
  }
}

function transformLevel (level) {
  return level === 0 ? null : parseInt(level, 10)
}

function transformRarity (rarity) {
  return rarities[rarity]
}

function transformSkin (skin) {
  return skin ? parseInt(skin, 10) : null
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

function transformTradable (flags) {
  let untradableFlags = ['AccountBound', 'MonsterOnly', 'SoulbindOnAcquire']
  return flags.filter(x => untradableFlags.indexOf(x) !== -1).length === 0
}

function transformPrices (item, prices) {
  return {
    buy: {
      quantity: prices.buys.quantity,
      price: prices.buys.unit_price,
      last_change: lastPriceChange(item.buy, prices.buys)
    },
    sell: {
      quantity: prices.sells.quantity,
      price: prices.sells.unit_price,
      last_change: lastPriceChange(item.sell, prices.sells)
    },
    last_update: isoDate()
  }
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

// Return the date as a ISO 8601 string
function isoDate (date) {
  date = date ? new Date(date) : new Date()
  return date.toISOString().slice(0, 19) + '+0000'
}

module.exports = {initialize, loadItems, loadItemPrices}
