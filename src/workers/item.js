const AbstractWorker = require('../worker.js')
const logger = require('../logger.js')
const async = require('async-promises')
const rarities = require('../static/rarities.js')
const categories = require('../static/categories.js')
const mergeById = require('../helpers/mergeById.js')

class ItemWorker extends AbstractWorker {
  async initialize () {
    await this.execute(this.loadItems)
    await this.execute(this.loadItemPrices)
    this.schedule(this.loadItems, 60 * 60)
    this.schedule(this.loadItemPrices, 60)
    logger.success('Initialized ItemWorker')
  }

  async loadItems () {
    let items = await async.parallel([
      () => this.api().language('en').items().all(),
      () => this.api().language('de').items().all(),
      () => this.api().language('fr').items().all(),
      () => this.api().language('es').items().all()
    ])

    this.cache.items = this.cache.items || {}
    this.cache.items = {
      en: mergeById(this.cache.items.en, items[0].map(transformItem)),
      de: mergeById(this.cache.items.de, items[1].map(transformItem)),
      fr: mergeById(this.cache.items.fr, items[2].map(transformItem)),
      es: mergeById(this.cache.items.es, items[3].map(transformItem))
    }
  }

  async loadItemPrices () {
    let prices = await this.api().commerce().prices().all()
    for (let lang in this.cache.items) {
      this.cache.items[lang] = mergeById(this.cache.items[lang], prices, true, transformPrices)
    }
  }
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

module.exports = ItemWorker
