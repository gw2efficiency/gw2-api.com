const mongo = require('../../helpers/mongo.js')
const async = require('gw2e-async-promises')
const valueCalculation = require('gw2e-item-value')
const config = require('../../config/application.js')

async function itemValues (job, done) {
  job.log(`Starting job`)

  let collection = mongo.collection('items')
  let attributes = {_id: 0, id: 1, sell: 1, buy: 1, crafting: 1, vendor_price: 1, value: 1}
  let items = await collection.find({lang: config.server.defaultLanguage}, attributes).toArray()
  job.log(`Calculating values for ${items.length} items`)

  items = items.map(item => calculateItemValue(item, items)).filter(item => item)
  job.log(`Calculated new values for ${items.length} items`)

  let updateFunctions = items.map(item =>
    () => collection.updateMany({id: item.id}, {$set: item})
  )
  job.log(`Created update functions`)

  await async.parallel(updateFunctions, config.mongo.parallelWriteLimit)
  job.log(`Calculated values items`)

  // Get the average value for ascended boxes based on the average
  // of all ascended weapon and armor that might come out of boxes
  await ascendedBoxValues()
  job.log(`Calculated values for ascended boxes`)
  done()
}

function calculateItemValue (item, items) {
  let itemValue = valueCalculation.itemValue(item)

  // If the value is not set or the value is the vendor price,
  // check if we can inherit the value from somewhere else
  if (!itemValue || itemValue === item.vendor_price) {
    let inheritedItem = valueCalculation.itemInherits(item.id)

    // This item inherits the value of an other item
    if (inheritedItem && inheritedItem.id) {
      let valueItem = items.find(i => i.id === inheritedItem.id)
      itemValue = valueCalculation.itemValue(valueItem) * inheritedItem.count + (inheritedItem.gold || 0)
    }

    // This item has a hardcoded gold value
    if (inheritedItem && !inheritedItem.id) {
      itemValue = inheritedItem.gold
    }
  }

  // Don't update the value if it's still the same
  if (itemValue === item.value) {
    return false
  }

  return {
    id: item.id,
    value: itemValue,
    valueIsVendor: itemValue === item.vendor_price
  }
}

// Blacklist ascended boxes that don't reward ascended gear
const ascendedBoxBlacklist = [77886, 68326]
const raidAscended = require('../../static/raidAscended.js')

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
  const ascendedBoxes = await collection.find(
    {
      rarity: 6,
      'category.0': 4,
      'category.1': {$in: [0, 1]},
      'id': {$not: {$in: ascendedBoxBlacklist}},
      lang: config.server.defaultLanguage,
      name: {$regex: '(chest|hoard)', $options: 'i'}
    },
    {_id: 0, id: 1}
  ).toArray()

  // Find ascended items that cant be crafted, just add ascended box average for that
  const ascendedItems = await collection.find(
    {
      lang: config.server.defaultLanguage,
      name: {$in: raidAscended}
    },
    {_id: 0, id: 1}
  ).toArray()

  // Concat ids to update together
  const updateIds = [].concat(
    ascendedBoxes.map(i => i.id),
    ascendedItems.map(i => i.id)
  )

  // Update all ascended boxes with the average price
  await collection.updateMany({id: {$in: updateIds}}, {$set: {value: ascendedAverage}})
}

module.exports = itemValues
