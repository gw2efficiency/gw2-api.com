const mongo = require('../../helpers/mongo.js')

async function skinPrices () {
  let skins = (await mongo.collection('cache').find({id: 'skinsToItems'}).limit(1).next()).content
  let items = await mongo.collection('items').find(
    {lang: 'en', value: {'$ne': null}, valueIsVendor: false},
    {_id: 0, id: 1, value: 1}
  ).toArray()

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

  await mongo.collection('cache').update(
    {id: 'skinPrices'},
    {id: 'skinPrices', content: skins},
    {upsert: true}
  )
}

module.exports = skinPrices
