const mongo = require('../../helpers/mongo.js')
const api = require('../../helpers/api.js')
const config = require('../../config/application.js')

async function skinList (job, done) {
  job.log(`Starting job`)

  let skins = await api().skins().all()
  let items = await mongo.collection('items')
    .find({lang: config.server.defaultLanguage}, {_id: 0, id: 1, skins: 1})
    .toArray()
  job.log(`Resolving ${skins.length} skins into items using ${items.length} items`)

  // Resolve the skins from items
  skins = skins.map(skin => {
    skin.items = items.filter(i => i.skins.indexOf(skin.id) !== -1).map(i => i.id)
    return skin
  })

  // Map skin ids to an array of item ids
  let skinsToItems = {}
  skins.map(skin => skinsToItems[skin.id] = skin.items)
  job.log(`Resolved skins to items`)

  await mongo.collection('cache').updateOne(
    {id: 'skinsToItems'},
    {id: 'skinsToItems', content: skinsToItems},
    {upsert: true}
  )
  job.log(`Updated skin to items`)
  done()
}

module.exports = skinList
