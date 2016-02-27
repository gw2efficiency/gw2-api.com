const AbstractWorker = require('../worker.js')
const logger = require('../logger.js')

class SkinWorker extends AbstractWorker {
  async initialize () {
    if (this.cache.state.items !== undefined && this.cache.state.skinsToItems === undefined) {
      await this.execute(this.loadSkinList)
    }

    this.schedule(this.loadSkinList, 6 * 60 * 60)
    logger.success('Initialized SkinWorker')
  }

  async loadSkinList () {
    let skins = await this.api().skins().all()
    let items = this.cache.state.items.en.map(x => ({id: x.id, name: x.name.trim()}))

    // Try and resolve the skins from items
    skins = skins.map(s => {
      s.name = s.name.trim()
      s.items = resolveSkin(s, items)
      return s
    })

    // Map skin ids to an array of item ids
    let map = {}
    skins.map(s => map[s.id] = s.items)
    this.cache.state.skinsToItems = map

    // Show how many skins we failed to resolve
    let missingSkinItems = skins.filter(s => s.items.length === 0)
    logger.info('No items found for ' + missingSkinItems.length + ' skins')
  }
}

function resolveSkin (skin, items) {
  // Resolve by id
  let skinItems = items.filter(x => x.skin === skin.id)
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  // Resolve by exact name
  skinItems = items.filter(x => x.name === skin.name)
  if (skinItems.length > 0) {
    return skinItems.map(x => x.id)
  }

  // Resolve by name + ' Skin'
  let skinName = skin.name + ' Skin'
  skinItems = items.filter(x => x.name === skinName)
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

module.exports = SkinWorker
