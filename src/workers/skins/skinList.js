const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')

async function skinList () {
  let skins = await api().skins().all()
  let items = await mongo.collection('items').find({lang: 'en'}, {_id: 0, id: 1, skins: 1}).toArray()

  // Resolve the skins from items
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
}

module.exports = skinList
