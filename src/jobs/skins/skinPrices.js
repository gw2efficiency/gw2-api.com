const mongo = require('../../helpers/mongo.js')
const config = require('../../config/application.js')

async function skinPrices (job, done) {
  job.log(`Starting job`)

  let skins = (await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()).content
  let items = await mongo.collection('items').find(
    {lang: config.server.defaultLanguage, value: {$ne: null}, valueIsVendor: false},
    {_id: 0, id: 1, value: 1}
  ).toArray()
  job.log(`Calculating prices of ${Object.keys(skins).length} skins using ${items.length} items`)

  // Get all items as a value map
  let valueMap = {}
  items.map(i => valueMap[i.id] = i.value)

  // Go through the skins and find the minimal price for them
  for (let key in skins) {
    let values = skins[key].map(i => valueMap[i] || 0).filter(x => x > 0)
    let skinValue = Math.min.apply(null, values)

    if (values.length > 0 && skinValue > 0) {
      skins[key] = skinValue
    } else {
      delete skins[key]
    }
  }
  job.log(`Calculated prices of ${Object.keys(skins).length} skins`)

  await mongo.collection('cache').updateOne(
    {id: 'skinPrices'},
    {id: 'skinPrices', content: skins},
    {upsert: true}
  )
  job.log(`Updated skin values`)
  done()
}

module.exports = skinPrices
