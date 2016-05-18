const mongo = require('../../helpers/mongo.js')
const async = require('gw2e-async-promises')
const accountValue = require('gw2e-account-value')
const config = require('../../config/application.js')

async function itemValues (job, done) {
  job.log(`Starting job`)

  let collection = mongo.collection('items')
  let attributes = {_id: 0, id: 1, sell: 1, buy: 1, crafting: 1, vendor_price: 1, value: 1}
  let items = await collection.find({lang: config.server.defaultLanguage}, attributes).toArray()
  job.log(`Calculating values for ${items.length} items`)

  let updateFunctions = items.map(item => async () => {
    let itemValue = accountValue.itemValue(item)

    // If the value is not set or the value is the vendor price,
    // check if we can inherit the value from somewhere else
    if (!itemValue || itemValue === item.vendor_price) {
      let inheritedItem = accountValue.itemInherits(item.id)

      // This item inherits the value of an other item
      if (inheritedItem && inheritedItem.id) {
        let valueItem = items.find(i => i.id === inheritedItem.id)
        itemValue = accountValue.itemValue(valueItem) * inheritedItem.count + (inheritedItem.gold || 0)
      }

      // This item has a hardcoded gold value
      if (inheritedItem && !inheritedItem.id) {
        itemValue = inheritedItem.gold
      }
    }

    // Don't update the value if it's still the same
    if (itemValue === item.value) {
      return
    }

    let update = {
      value: itemValue,
      valueIsVendor: itemValue === item.vendor_price
    }

    await collection.update({id: item.id}, {'$set': update}, {multi: true})
  })
  job.log(`Created update functions`)

  await async.parallel(updateFunctions)
  job.log(`Calculated values items`)

  // Get the average value for ascended boxes based on the average
  // of all ascended weapon and armor that might come out of boxes
  await ascendedBoxValues()
  job.log(`Calculated values for ascended boxes`)
  done()
}

async function ascendedBoxValues () {
  let collection = mongo.collection('items')
  let ascendedAverage = await collection.aggregate([
    {
      $match: {
        rarity: 6,
        craftable: true,
        lang: config.server.defaultLanguage,
        'category.0': {$in: [0, 14]},
        valueIsVendor: false,
        name: {$regex: '(\'s|wupwup|Veldrunner|Zintl|Veldrunner|Angchu)', $options: 'i'},
        value: {$gt: 0}
      }
    },
    {$group: {_id: null, average: {$avg: '$value'}}}
  ]).limit(1).next()

  // We don't have any ascended items, so let's not bother
  // This can happen during testing or during server setup
  if (ascendedAverage === null) {
    return
  }

  ascendedAverage = Math.round(ascendedAverage.average)

  // Find ascended boxes ids (we are filtering out the recipes here)
  let ids = await collection.find(
    {
      rarity: 6,
      'category.0': 4,
      'category.1': {$in: [0, 1]},
      lang: config.server.defaultLanguage,
      name: {'$regex': '(chest|hoard)', '$options': 'i'}
    },
    {_id: 0, id: 1}
  ).toArray()

  // Update all ascended boxes with the average price
  await collection.update({id: {$in: ids.map(i => i.id)}}, {$set: {value: ascendedAverage}}, {multi: true})
}

module.exports = itemValues
