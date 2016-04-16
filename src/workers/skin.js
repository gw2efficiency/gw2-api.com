const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')

async function initialize () {
  let skinCollection = mongo.collection('cache')
  skinCollection.createIndex('id')
  let skinExists = !!(await skinCollection.find({id: 'skinsToItems'}).limit(1).next())

  let itemCollection = mongo.collection('items')
  let itemExists = !!(await itemCollection.find({}).limit(1).next())

  if (itemExists && !skinExists) {
    await execute(loadSkinList)
    await execute(loadSkinPrices)
  }

  // Update the skin list every day at 3
  schedule('0 0 3 * * *', loadSkinList)

  // Update the skin prices every 5 minutes
  schedule('*/5 * * * *', loadSkinPrices)

  logger.info('Initialized skin worker')
}

async function loadSkinList () {
  let skins = await api().skins().all()
  let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, id: 1, skins: 1}).toArray()

  // Try and resolve the skins from items
  skins = skins.map(skin => {
    skin.items = items.filter(i => i.skins.indexOf(skin.id) !== -1).map(i => i.id)
    return skin
  })

  // Map skin ids to an array of item ids
  let skinsToItems = {}
  skins.map(skin => skinsToItems[skin.id] = skin.items)

  await mongo.collection('cache').update(
    {id: 'skinsToItems'},
    {id: 'skinsToItems', content: skinsToItems},
    {upsert: true}
  )

  // Show how many skins we failed to resolve
  let missingSkinItems = skins.filter(s => s.items.length === 0)
  logger.info('No items found for ' + missingSkinItems.length + ' skins')
}

async function loadSkinPrices () {
  let skins = (await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()).content
  let items = await mongo.collection('items').find(
    {lang: 'en', value: {'$ne': null}, valueIsVendor: false},
    {_id: 0, id: 1, value: 1}
  ).toArray()

  let priceMap = {}
  items.map(i => priceMap[i.id] = i.value)

  for (let key in skins) {
    let prices = skins[key].map(i => priceMap[i] || 0).filter(x => x > 0)
    let skinPrice = Math.min.apply(null, prices)

    if (prices.length > 0 && skinPrice > 0) {
      skins[key] = skinPrice
    } else {
      delete skins[key]
    }
  }

  await mongo.collection('cache').update(
    {id: 'skinPrices'},
    {id: 'skinPrices', content: skins},
    {upsert: true}
  )
}

module.exports = {initialize, loadSkinList, loadSkinPrices}
