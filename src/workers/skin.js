const logger = require('../helpers/logger.js')
const storage = require('../helpers/sharedStorage.js')
const {execute, schedule} = require('../helpers/workers.js')
const api = require('../helpers/api.js')

async function initialize () {
  if (storage.get('items') !== undefined && storage.get('skinsToItems') === undefined) {
    await execute(loadSkinList)
  }

  schedule(loadSkinList, 60 * 60)
  logger.info('Initialized skin worker')
}

let items = []
async function loadSkinList () {
  let skins = await api().skins().all()
  items = storage.get('items').en

  // Try and resolve the skins from items
  skins = skins.map(skin => {
    skin.name = skin.name.trim()
    skin.items = resolveSkin(skin)
    return skin
  })

  // Map skin ids to an array of item ids
  let map = {}
  skins.map(s => map[s.id] = s.items)
  storage.set('skinsToItems', map)
  storage.save()

  // Show how many skins we failed to resolve
  let missingSkinItems = skins.filter(s => s.items.length === 0)
  logger.info('No items found for ' + missingSkinItems.length + ' skins')
}

function resolveSkin (skin) {
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
