const logger = require('../helpers/logger.js')
const storage = require('../helpers/sharedStorage.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')
const async = require('gw2e-async-promises')
const rarities = require('../static/rarities.js')
const categories = require('../static/categories.js')
const mergeById = require('../helpers/mergeById.js')

const languages = ['en', 'de', 'fr', 'es']

async function initialize () {
  if (storage.get('items') === undefined) {
    await execute(loadItems)
    await execute(loadItemPrices)
  }

  schedule(loadItems, 60 * 60)
  schedule(loadItemPrices, 60)
  logger.info('Initialized item worker')
}

async function loadItems () {
  let requests = languages.map(lang => () => api().language(lang).items().all())
  let items = await async.parallel(requests)

  // Go through the item array of each language, and save
  // name and description as localized keys
  items = languages.map((lang, i) => {
    return items[i].map(item => {
      item['name_' + lang] = item.name
      item['description_' + lang] = item.description
      delete item.name
      delete item.description
      return item
    })
  })

  // Merge the items of all languages together
  let transformed = []
  languages.map((l, i) => transformed = mergeById(transformed, items[i]))

  // Save with the legacy format
  let storedItems = storage.get('items', [])
  storage.set('items', mergeById(storedItems, transformed.map(transformItem)))
  storage.save()
}

async function loadItemPrices () {
  let prices = await api().commerce().prices().all()
  let storedItems = storage.get('items', {})
  storage.set('items', mergeById(storedItems, prices, true, transformPrices))
  storage.save()
}

// Transform an item into the expected legacy structure
function transformItem (item) {
  let localizedText = {}
  languages.map(l => {
    localizedText['name_' + l] = item['name_' + l]
    localizedText['description_' + l] = transformDescription(item['description_' + l])
  })

  return {
    id: item.id,
    ...localizedText,
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
