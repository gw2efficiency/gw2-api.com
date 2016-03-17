const logger = require('../helpers/logger.js')
const mongo = require('../helpers/mongo.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')

async function initialize () {
  let skinCollection = mongo.collection('cache')
  skinCollection.createIndex('id')
  let skinExists = !!await skinCollection.find({id: 'skinsToItems'}).limit(1).next()

  let itemCollection = mongo.collection('items')
  let itemExists = !!await itemCollection.find({}).limit(1).next()

  if (itemExists && !skinExists) {
    await execute(loadSkinList)
  }

  // Update the skin list every day at 3
  schedule('0 0 3 * * *', loadSkinList)

  logger.info('Initialized skin worker')
}

let items = []
async function loadSkinList () {
  let skins = await api().skins().all()
  let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, id: 1, name: 1, skin: 1}).toArray()

  // Try and resolve the skins from items
  skins = skins.map(skin => {
    skin.name = skin.name.trim()
    skin.items = resolveSkin(skin, items)
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

function resolveSkin (skin, items) {
  // Resolve by id
  let skinItems = items.filter(x => x.skin === skin.id)
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  // Resolve by name + ' Skin'
  let skinName = skin.name + ' Skin'
  skinItems = items.filter(x => x.name === skinName)
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  // Resolve by exact name
  skinItems = items.filter(x => x.name === skin.name)
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  // Resolve by any part of the name
  let skinNamePart = new RegExp('(^| )' + skin.name + '( |$)')
  skinItems = items.filter(x => x.name.match(skinNamePart))
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  return []
}

module.exports = {initialize, loadSkinList}
