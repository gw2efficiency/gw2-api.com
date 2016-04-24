const rarities = require('../../static/rarities.js')
const categories = require('../../static/categories.js')
const tradingpostBlacklist = require('../../static/tradingpostBlacklist.js')

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

module.exports = transformItem
