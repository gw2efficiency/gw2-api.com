const mongo = require('../../helpers/mongo.js')
const config = require('../../config/application.js')

async function skinPrices (job, done) {
  job.log(`Starting job`)

  let skins = (await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()).content
  var valueMap = await getItemValues()
  job.log(`Calculating prices of ${Object.keys(skins).length} skins using ${valueMap.length} item values`)

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

async function getItemValues () {
  let items = await mongo.collection('items').find(
    {lang: config.server.defaultLanguage, value: {$ne: null}, valueIsVendor: false},
    {_id: 0, id: 1, value: 1, 'buy.price': 1}
  ).toArray()

  let values = {}
  items.map(i => {
    // Ignore "buy price" values, because it should use the sell price of the next
    // item instead. This should only happen for items fresh on the tradingpost,
    // since the value is else set to the "last known sell price"
    if (i.buy && i.value === i.buy.price) {
      return
    }

    values[i.id] = i.value
  })

  return values
}

module.exports = skinPrices
